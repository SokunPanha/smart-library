"use client";

import { useState, useRef, useEffect } from "react";
import { Form, type FormInstance } from "antd";

export function useFormDrawer<T = unknown>() {
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form] = Form.useForm<any>();
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      form.resetFields();
      if (ref.current) form.setFieldsValue(ref.current as Parameters<typeof form.setFieldsValue>[0]);
    }, 0);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const openDrawer = (data?: T) => {
    ref.current = data;
    setOpen(true);
  };

  const closeDrawer = () => {
    setOpen(false);
    ref.current = undefined;
  };

  return {
    open: openDrawer,
    close: closeDrawer,
    getData: () => ref.current,
    form,
    isOpen: open,
    props: {
      open,
      onClose: closeDrawer,
      form: form as FormInstance,
    },
  };
}
