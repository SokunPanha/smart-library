"use client";

import { useState, useRef } from "react";
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

  const openModal = (data?: T) => {
    ref.current = data;
    form.resetFields();
    if (data) form.setFieldsValue(data as Parameters<typeof form.setFieldsValue>[0]);
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

  const openDrawer = (data?: T) => {
    ref.current = data;
    form.resetFields();
    if (data) form.setFieldsValue(data as Parameters<typeof form.setFieldsValue>[0]);
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
