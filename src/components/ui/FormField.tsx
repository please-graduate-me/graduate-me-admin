import { cloneElement, useId, type ReactElement, type ReactNode } from 'react';
import { Field as StoredField } from 'rc-field-form';
import type { FieldProps } from 'rc-field-form/es/Field';
import { Field } from '@astryxdesign/core/Field';

type Props = Omit<FieldProps, 'children'> & {
  label?: string;
  description?: ReactNode;
  children: ReactElement<Record<string, unknown>>;
};

/** 반복되는 관리 폼의 기존 검증과 Astryx 입력의 오류·접근성 상태를 연결한다. */
export function FormField({ label, description, children, ...props }: Props) {
  const id = useId();

  if (!props.name)
    return (
      <Field
        label={label ?? '선택'}
        inputID={id}
        description={typeof description === 'string' ? description : undefined}>
        {cloneElement(children, { id })}
      </Field>
    );

  return (
    <StoredField {...props}>
      {(control, meta) =>
        cloneElement(children, {
          ...control,
          id,
          label: label ?? children.props.label,
          isLabelHidden: !label && children.props.isLabelHidden,
          description,
          value: control.value ?? children.props.value ?? '',
          status: meta.errors.length
            ? { type: 'error', message: meta.errors.join(' ') }
            : undefined,
          'aria-invalid': meta.errors.length > 0 || undefined,
        })
      }
    </StoredField>
  );
}
