"use client";

import { useState, useRef } from "react";
import { Table, Button, Input, Space, App } from "antd";
import { PlusOutlined, SearchOutlined, PrinterOutlined, ImportOutlined } from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { MembersProvider, useMembersContext } from "./helper/hooks";
import { useFetchMembers } from "./helper/useFetchMembers";
import { useMembers } from "./helper/useMembers";
import { buildMemberColumns } from "./_components/Columns";
import { CreateMemberDrawer, EditMemberDrawer } from "./_components/MemberDrawerForm";
import { MemberQRModal, buildMemberCardHtml, CARD_PRINT_CSS } from "./_components/MemberQRModal";
import { MemberProfileDrawer } from "./_components/MemberProfileDrawer";
import { MemberBulkImportModal } from "./_components/BulkImportModal";
import type { Member } from "./helper/useFetchMembers";
import { useDebounce, useTableScroll } from "@/lib/hooks";
import { apiFetch } from "@/lib/request";

function MembersPageInner() {
  const ctx = useMembersContext();
  const actions = useMembers();
  const { modal } = App.useApp();

  const [inputVal, setInputVal] = useState("");
  const search = useDebounce(inputVal, 400);
  const [qrMember, setQrMember] = useState<Member | null>(null);
  const [profileMemberId, setProfileMemberId] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const bulkQRRef = useRef<HTMLDivElement>(null);

  const t = useTranslations();
  const { data, isLoading } = useFetchMembers(search, ctx.table.page);
  const members = data?.members ?? [];
  const selectedMembers = members.filter((m) => selectedRowKeys.includes(m.id));
  const columns = buildMemberColumns({ ctx, actions, t, onQR: setQrMember });
  const { ref: tableRef, scrollY } = useTableScroll();
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["settings"],
    queryFn: () => apiFetch<Record<string, string>>("/api/settings"),
  });
  const libraryName = settings?.libraryNameKh ?? settings?.libraryNameEn ?? "បណ្ណាល័យ វិ.ហ.ស.ខ្ច";

  function doPrint(title: string) {
    const svgEls = bulkQRRef.current?.querySelectorAll("[data-qr] svg");
    if (!svgEls) return;

    const cards = selectedMembers.map((member, i) => {
      const svgEl = svgEls[i];
      const qrSvg = svgEl ? new XMLSerializer().serializeToString(svgEl) : "";
      return buildMemberCardHtml(member, qrSvg, title);
    });

    const pages: string[] = [];
    for (let i = 0; i < cards.length; i += 8) {
      const chunk = cards.slice(i, i + 8).join("");
      pages.push(`<div class="page"><div class="grid">${chunk}</div></div>`);
    }

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>Member Cards</title>
    <style>
      @page { size: A4 portrait; margin: 10mm; }
      ${CARD_PRINT_CSS}
    </style>
  </head>
  <body>
    ${pages.join("")}
    <script>window.onload = () => { window.print(); window.close(); }<\/script>
  </body>
</html>`);
    win.document.close();
  }

  function handleBulkPrint() {
    if (selectedMembers.length === 0) return;
    let title = libraryName;
    modal.confirm({
      title: t("members.cardTitle"),
      content: (
        <Input
          defaultValue={libraryName}
          onChange={(e) => { title = e.target.value; }}
          placeholder={libraryName}
          className="mt-2"
          autoFocus
        />
      ),
      okText: t("common.confirm"),
      cancelText: t("common.cancel"),
      onOk: () => doPrint(title || libraryName),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-semibold text-slate-800">{t("members.title")}</h1>
        <Space wrap>
          {selectedRowKeys.length > 0 && (
            <Button icon={<PrinterOutlined />} onClick={handleBulkPrint}>
              <span className="hidden sm:inline">{t("members.printSelected")}</span>
              {` (${selectedRowKeys.length})`}
            </Button>
          )}
          <Button icon={<ImportOutlined />} onClick={() => setImportOpen(true)}>
            <span className="hidden sm:inline">{t("members.bulkImport.title")}</span>
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => ctx.createForm.open()}>
            <span className="hidden sm:inline">{t("members.addMember")}</span>
          </Button>
        </Space>
      </div>

      <div className="bg-white border border-slate-100 rounded-lg p-4">
        <Input
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder={t("members.searchPlaceholder")}
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); ctx.table.setPage(1); }}
          className="max-w-sm mb-4"
          allowClear
        />
        <div ref={tableRef}>
          <Table
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
              columnWidth: 40,
            }}
            columns={columns}
            dataSource={members}
            rowKey="id"
            loading={isLoading}
            size="small"
            scroll={{ x: "max-content", y: scrollY }}
            onRow={(row) => ({
              onClick: (e) => {
                const target = e.target as HTMLElement;
                if (target.closest("button,a,[role=button],.ant-image")) return;
                setProfileMemberId(row.id);
              },
              className: "cursor-pointer",
            })}
            {...ctx.table.props}
            pagination={{ ...ctx.table.props.pagination, total: data?.total ?? 0 }}
            locale={{ emptyText: t("members.empty") }}
          />
        </div>
      </div>

      {/* Off-screen QR codes for bulk print */}
      <div
        ref={bulkQRRef}
        style={{ position: "fixed", left: "-9999px", top: 0, visibility: "hidden", pointerEvents: "none" }}
        aria-hidden
      >
        {selectedMembers.map((member) => (
          <div key={member.id} data-qr="">
            <QRCodeSVG value={member.memberId} size={180} level="M" />
          </div>
        ))}
      </div>

      <CreateMemberDrawer />
      <EditMemberDrawer />
      <MemberQRModal member={qrMember} onClose={() => setQrMember(null)} />
      <MemberProfileDrawer memberId={profileMemberId} onClose={() => setProfileMemberId(null)} />
      <MemberBulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => ctx.table.reload()}
      />
    </div>
  );
}

export default function MembersPage() {
  return (
    <MembersProvider>
      <MembersPageInner />
    </MembersProvider>
  );
}
