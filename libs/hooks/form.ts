"use client";

import { useState, useRef, useEffect } from "react";
import { Form, type FormInstance } from "antd";

/**
 * Manages a modal's open state + its form data.
 * Call .open(record) to open with data, .close() to dismiss.
 * Spread .props into ModalForm / Drawer extra button.
 */
export function useModalForm<T = unknown>() {
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form] = Form.useForm<any>();
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (ref.current) form.setFieldsValue(ref.current as Parameters<typeof form.setFieldsValue>[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const openModal = (data?: T) => {
    ref.current = data;
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    ref.current = undefined;
  };

  const getData = () => ref.current;

  return {
    open: openModal,
    close: closeModal,
    getData,
    form,
    isOpen: open,
    props: {
      open,
      onClose: closeModal,
      form: form as FormInstance,
    },
  };
}

/**
 * Same as useModalForm but for Drawer components.
 */
export function useDrawerForm<T = unknown>() {
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form] = Form.useForm<any>();
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (ref.current) form.setFieldsValue(ref.current as Parameters<typeof form.setFieldsValue>[0]);
    }
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
