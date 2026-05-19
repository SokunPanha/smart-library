"use client";

import { useState, useEffect, useRef } from "react";
import { Button, Input, Tag, Popconfirm, Divider, App, Spin } from "antd";
import { PlusOutlined, DeleteOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/libs/utils/request";

interface ClassItem {
  id: string;
  name: string;
  grade: string | null;
  _count: { members: number };
}

interface GradeRow {
  grade: string;
  sections: string[];
}

const DEFAULT_SECTIONS = ["A", "B", "C", "D"];
const DEFAULT_GRADES = ["7", "8", "9", "10", "11", "12"];
const COMMON_SECTIONS = ["A", "B", "C", "D", "E", "F"];

function SectionChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-0.5 rounded text-xs font-medium border transition-colors ${
        active
          ? "bg-blue-500 border-blue-500 text-white"
          : "bg-white border-slate-300 text-slate-500 hover:border-blue-400"
      }`}
    >
      {label}
    </button>
  );
}

export function ClassesTab() {
  const t = useTranslations("settings.classes");
  const { message } = App.useApp();
  const qc = useQueryClient();

  const [rows, setRows] = useState<GradeRow[]>(() =>
    DEFAULT_GRADES.map((g) => ({ grade: g, sections: [...DEFAULT_SECTIONS] }))
  );
  const [newGrade, setNewGrade] = useState("");
  const [manualName, setManualName] = useState("");
  const [generating, setGenerating] = useState(false);

  const { data: classes = [], isLoading } = useQuery<ClassItem[]>({
    queryKey: ["classes"],
    queryFn: () => apiFetch<ClassItem[]>("/api/classes"),
  });

  const deleteMutation = useMutation({
    mutationFn: (item: ClassItem) => apiFetch(`/api/classes/${item.id}`, { method: "DELETE" }),
    onSuccess: (_, item) => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      if (item.grade) {
        const section = item.name.slice(item.grade.length);
        if (section) {
          setRows((prev) =>
            prev.map((r) =>
              r.grade !== item.grade ? r : { ...r, sections: r.sections.filter((s) => s !== section) }
            )
          );
        }
      }
    },
    onError: (e: Error) => message.error(e.message),
  });

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isLoading || hasInitialized.current) return;
    hasInitialized.current = true;

    const dbGradeMap = new Map<string, string[]>();
    classes.forEach((c) => {
      if (!c.grade) return;
      const section = c.name.slice(c.grade.length);
      if (!section) return;
      if (!dbGradeMap.has(c.grade)) dbGradeMap.set(c.grade, []);
      dbGradeMap.get(c.grade)!.push(section);
    });

    const allGrades = new Set([...DEFAULT_GRADES, ...dbGradeMap.keys()]);
    const newRows = [...allGrades]
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((grade) => ({
        grade,
        sections: dbGradeMap.has(grade)
          ? dbGradeMap.get(grade)!.sort()
          : [...DEFAULT_SECTIONS],
      }));

    setRows(newRows);
  }, [classes, isLoading]);

  // Derived preview
  const preview = rows.flatMap((r) =>
    r.sections.map((s) => ({ name: `${r.grade}${s}`, grade: r.grade }))
  );
  const existingNames = new Set(classes.map((c) => c.name));
  const newCount = preview.filter((p) => !existingNames.has(p.name)).length;
  const affectedGrades = new Set(rows.map((r) => r.grade));
  const previewNames = new Set(preview.map((p) => p.name));
  const deleteCount = classes.filter((c) => c.grade && affectedGrades.has(c.grade) && !previewNames.has(c.name)).length;

  function toggleSection(gradeIdx: number, section: string) {
    setRows((prev) =>
      prev.map((r, i) =>
        i !== gradeIdx ? r : {
          ...r,
          sections: r.sections.includes(section)
            ? r.sections.filter((s) => s !== section)
            : [...r.sections, section].sort(),
        }
      )
    );
  }

  function addCustomSection(gradeIdx: number, value: string) {
    const s = value.trim().toUpperCase();
    if (!s) return;
    setRows((prev) =>
      prev.map((r, i) =>
        i !== gradeIdx || r.sections.includes(s) ? r : { ...r, sections: [...r.sections, s].sort() }
      )
    );
  }

  function removeRow(gradeIdx: number) {
    setRows((prev) => prev.filter((_, i) => i !== gradeIdx));
  }

  function addGradeRow() {
    const g = newGrade.trim();
    if (!g || rows.some((r) => r.grade === g)) return;
    setRows((prev) => [...prev, { grade: g, sections: [...DEFAULT_SECTIONS] }]);
    setNewGrade("");
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await apiFetch<{ created: number; skipped: number; deleted: number; skippedDelete: number }>("/api/classes/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classes: preview }),
      });
      message.success(t("generateSuccess", { created: res.created, deleted: res.deleted }));
      if (res.skippedDelete > 0) {
        message.warning(t("generateSkippedDelete", { count: res.skippedDelete }));
      }
      qc.invalidateQueries({ queryKey: ["classes"] });
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : t("generateError"));
    } finally {
      setGenerating(false);
    }
  }

  async function handleManualAdd() {
    const name = manualName.trim();
    if (!name) return;
    try {
      await apiFetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      message.success(t("addedSuccess"));
      setManualName("");
      qc.invalidateQueries({ queryKey: ["classes"] });
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : t("addError"));
    }
  }

  // Group existing classes by grade
  const grouped = classes.reduce<Record<string, ClassItem[]>>((acc, c) => {
    const key = c.grade ?? t("other");
    (acc[key] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6 w-full max-w-2xl">

      {/* Generator */}
      <div className="border border-slate-200 rounded-lg p-3 sm:p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ThunderboltOutlined className="text-blue-500" />
          <span className="font-medium text-slate-700">{t("generator")}</span>
        </div>

        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={row.grade} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              {/* Grade label + delete (always on same line) */}
              <div className="flex items-center justify-between sm:justify-start gap-2 flex-shrink-0">
                <span className="w-20 text-sm font-mono font-medium text-slate-600">
                  {t("grade")} {row.grade}
                </span>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeRow(i)}
                  className="sm:hidden"
                />
              </div>
              {/* Chips row */}
              <div className="flex items-center gap-1 flex-wrap flex-1">
                {COMMON_SECTIONS.map((s) => (
                  <SectionChip
                    key={s}
                    label={s}
                    active={row.sections.includes(s)}
                    onClick={() => toggleSection(i, s)}
                  />
                ))}
                {row.sections.filter((s) => !COMMON_SECTIONS.includes(s)).map((s) => (
                  <SectionChip key={s} label={s} active onClick={() => toggleSection(i, s)} />
                ))}
                <Input
                  size="small"
                  placeholder={t("customSection")}
                  className="w-20"
                  onPressEnter={(e) => { addCustomSection(i, e.currentTarget.value); e.currentTarget.value = ""; }}
                  onBlur={(e) => { addCustomSection(i, e.target.value); e.target.value = ""; }}
                />
              </div>
              {/* Delete button — desktop only, at end of row */}
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeRow(i)}
                className="hidden sm:inline-flex"
              />
            </div>
          ))}
        </div>

        {/* Add grade row */}
        <div className="flex flex-wrap items-center gap-2">
          <Input
            size="small"
            placeholder={t("addGradePlaceholder")}
            value={newGrade}
            onChange={(e) => setNewGrade(e.target.value)}
            onPressEnter={addGradeRow}
            className="w-36 flex-shrink-0"
          />
          <Button size="small" icon={<PlusOutlined />} onClick={addGradeRow}>{t("addGrade")}</Button>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="bg-slate-50 rounded p-3 space-y-1">
            <p className="text-xs text-slate-400 mb-2">{t("preview", { total: preview.length, new: newCount, delete: deleteCount })}</p>
            <div className="flex flex-wrap gap-1">
              {preview.map((p) => (
                <Tag
                  key={p.name}
                  className={`border-0 text-xs ${existingNames.has(p.name) ? "bg-slate-100 text-slate-400" : "bg-blue-50 text-blue-600"}`}
                >
                  {p.name}
                </Tag>
              ))}
              {/* show classes that will be deleted */}
              {classes
                .filter((c) => c.grade && affectedGrades.has(c.grade) && !previewNames.has(c.name))
                .map((c) => (
                  <Tag key={c.id} className="border-0 text-xs bg-red-50 text-red-400 line-through">
                    {c.name}
                  </Tag>
                ))}
            </div>
          </div>
        )}

        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          loading={generating}
          disabled={newCount === 0 && deleteCount === 0}
          onClick={handleGenerate}
        >
          {t("generate", { count: newCount, delete: deleteCount })}
        </Button>
      </div>

      {/* Manual add */}
      <div>
        <p className="text-sm font-medium text-slate-600 mb-2">{t("manualAdd")}</p>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder={t("manualPlaceholder")}
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            onPressEnter={handleManualAdd}
            className="flex-1 min-w-[160px] max-w-xs"
          />
          <Button icon={<PlusOutlined />} onClick={handleManualAdd}>{t("add")}</Button>
        </div>
      </div>

      <Divider className="my-2" />

      {/* Existing classes */}
      <div>
        <p className="text-sm font-medium text-slate-600 mb-3">
          {t("existing", { total: classes.length })}
        </p>
        {isLoading ? <Spin /> : (
          <div className="space-y-3">
            {Object.entries(grouped).map(([grade, items]) => (
              <div key={grade}>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{t("grade")} {grade}</p>
                <div className="flex flex-wrap gap-1">
                  {items.map((c) => (
                    <Tag
                      key={c.id}
                      className="border border-slate-200 bg-white text-slate-700 text-xs flex items-center gap-1"
                      closeIcon={
                        <Popconfirm
                          title={t("deleteConfirm", { name: c.name })}
                          onConfirm={() => deleteMutation.mutate(c)}
                          okText={t("deleteOk")}
                          cancelText={t("deleteCancel")}
                          disabled={c._count.members > 0}
                        >
                          <DeleteOutlined className={c._count.members > 0 ? "text-slate-300 cursor-not-allowed" : "text-red-400 cursor-pointer"} />
                        </Popconfirm>
                      }
                      onClose={(e) => e.preventDefault()}
                    >
                      {c.name}
                      {c._count.members > 0 && (
                        <span className="text-slate-400 ml-1">({c._count.members})</span>
                      )}
                    </Tag>
                  ))}
                </div>
              </div>
            ))}
            {classes.length === 0 && (
              <p className="text-sm text-slate-300">{t("empty")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
