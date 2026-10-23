/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import React, { ReactElement, ReactNode, RefObject, cloneElement, useEffect, useMemo, useRef, useState } from 'react';

import { useColorMode } from '@docusaurus/theme-common';
import CodeBlock from '@theme/CodeBlock';

import {
  ActionButton,
  Content,
  ContextualHelp,
  Heading,
  Picker,
  PickerItem,
  Provider,
  SegmentedControl,
  SegmentedControlItem,
  Slider,
  Switch,
  TextField,
} from '@react-spectrum/s2';
import * as labComponents from '@spectrum-charts/react-spectrum-charts-s2/lab';

import { ClientOnly } from '../ClientOnly';
import { docs, renderInlineCode } from '../PropsTable';
import styles from './PropPlayground.module.css';
import * as datasets from './data';
import { elementToJsx, getImportStatement } from './elementToJsx';

const S2_PACKAGE = '@spectrum-charts/react-spectrum-charts-s2';
const LAB = { from: `${S2_PACKAGE}/lab`, names: new Set(Object.keys(labComponents)) };

type Value = string | number | boolean;

// Longer option sets don't fit the controls column as a segmented control.
const MAX_SEGMENTED_CHARS = 20;

interface BaseControl<T extends Value> {
  /** Key in the values object passed to render. */
  name: string;
  label?: string;
  /** Heading the control is grouped under, usually the component that owns the prop. */
  group?: string;
  /** Docs shown in the control's info popover: `Component.prop`, or `Component` for its description. Defaults to the group (or playground component) and name. */
  doc?: string;
  defaultValue: T;
  /** Disables the control when it has no effect, e.g. a prop that only applies to one state. */
  isDisabled?: (values: Record<string, Value>) => boolean;
}

export type PlaygroundControl =
  | (BaseControl<boolean> & { type: 'boolean' })
  | (BaseControl<string> & { type: 'select'; options: string[] })
  | (BaseControl<string> & { type: 'text' })
  | (BaseControl<number> & { type: 'number'; min: number; max: number; step: number });

export type PlaygroundValues = Record<string, Value | undefined>;

export interface PropPlaygroundProps {
  controls: PlaygroundControl[];
  /** Builds the chart; values equal to a control's default are undefined so they're left out of the code. */
  render: (values: PlaygroundValues) => ReactElement;
  /** Shows a Replay button that remounts the chart, e.g. to rerun enter animations. */
  replay?: boolean;
  /** Width and height applied to the rendered chart only, so examples share a size without it showing in the code. */
  previewSize?: (element: ReactElement) => PreviewSize;
  /** Component that ungrouped controls document, e.g. `Donut`. */
  component?: string;
}

export interface PreviewSize {
  width?: number | 'auto';
  height?: number;
}

/**
 * Gets the info popover for a control from the generated component docs.
 * @param control playground control
 * @param component playground component for ungrouped controls
 * @returns contextual help element, or undefined when there are no docs
 */
const getContextualHelp = (control: PlaygroundControl, component?: string): ReactNode => {
  const key = control.doc ?? `${control.group ?? component}.${control.name}`;
  const [componentName, propName] = key.split('.');
  const componentDoc = docs[componentName];
  const description = propName
    ? componentDoc?.props.find((prop) => prop.name === propName)?.description
    : componentDoc?.description;
  if (!description) return undefined;
  return (
    <ContextualHelp variant="info" size="XS">
      <Heading>{propName ?? componentName}</Heading>
      <Content>{renderInlineCode(description)}</Content>
    </ContextualHelp>
  );
};

const getDefaults = (controls: PlaygroundControl[]) =>
  Object.fromEntries(controls.map((control) => [control.name, control.defaultValue])) as Record<string, Value>;

/** Fixes slider decimals to the step's precision so the value label keeps a constant width. */
const getSliderFormat = (step = 1): Intl.NumberFormatOptions => {
  const digits = String(step).split('.')[1]?.length ?? 0;
  return { minimumFractionDigits: digits, maximumFractionDigits: digits };
};

const ControlInput = ({
  control,
  value,
  isDisabled,
  contextualHelp,
  onChange,
}: {
  control: PlaygroundControl;
  value: Value;
  isDisabled: boolean;
  contextualHelp: ReactNode;
  onChange: (value: Value) => void;
}) => {
  const label = control.label ?? control.name;
  switch (control.type) {
    case 'boolean':
      return (
        <div className={styles.switchRow}>
          <Switch isSelected={value as boolean} isDisabled={isDisabled} onChange={onChange}>
            {label}
          </Switch>
          {contextualHelp}
        </div>
      );
    case 'number':
      return (
        <Slider
          label={label}
          minValue={control.min}
          maxValue={control.max}
          step={control.step}
          formatOptions={getSliderFormat(control.step)}
          contextualHelp={contextualHelp}
          isDisabled={isDisabled}
          value={value as number}
          onChange={onChange}
        />
      );
    case 'text':
      return (
        <TextField
          label={label}
          contextualHelp={contextualHelp}
          isDisabled={isDisabled}
          value={value as string}
          onChange={onChange}
        />
      );
    case 'select':
      if (control.options.length <= 3 && control.options.join('').length <= MAX_SEGMENTED_CHARS) {
        return (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>
              {label}
              {contextualHelp}
            </span>
            <SegmentedControl
              aria-label={label}
              isDisabled={isDisabled}
              selectedKey={value as string}
              onSelectionChange={(key) => onChange(String(key))}
            >
              {control.options.map((option) => (
                <SegmentedControlItem key={option} id={option}>
                  {option}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          </div>
        );
      }
      return (
        <Picker
          label={label}
          contextualHelp={contextualHelp}
          isDisabled={isDisabled}
          value={value as string}
          onChange={(key) => onChange(String(key))}
        >
          {control.options.map((option) => (
            <PickerItem key={option} id={option}>
              {option}
            </PickerItem>
          ))}
        </Picker>
      );
  }
};

const Code = ({ children }: { children: ReactNode }) => <code>{children}</code>;

/**
 * Gets the component and prop a control documents, when the generated docs have them.
 * @param control playground control
 * @param component playground component for ungrouped controls
 * @returns component and optional prop, or undefined when the control isn't a documented prop or component
 */
const getControlTarget = (
  control: PlaygroundControl,
  component?: string
): { component: string; prop?: string } | undefined => {
  const [componentName, propName] = (control.doc ?? `${control.group ?? component}.${control.name}`).split('.');
  const componentDoc = docs[componentName];
  if (!componentDoc) return undefined;
  if (!propName) return { component: componentName };
  return componentDoc.props.some((prop) => prop.name === propName)
    ? { component: componentName, prop: propName }
    : undefined;
};

const joinOptions = (options: string[]): ReactNode =>
  options.map((option, index) => (
    <React.Fragment key={option}>
      {index > 0 && (index === options.length - 1 ? ' or ' : ', ')}
      <Code>{option}</Code>
    </React.Fragment>
  ));

const getControlValues = (control: PlaygroundControl): ReactNode => {
  switch (control.type) {
    case 'boolean':
      return joinOptions(['true', 'false']);
    case 'select':
      return joinOptions(control.options);
    case 'number':
      return `${control.min} to ${control.max}, in steps of ${control.step}`;
    case 'text':
      return 'any text';
  }
};

/**
 * Describes a playground control for the page's Markdown export.
 * @param control playground control
 * @param component playground component for ungrouped controls
 * @returns list item content
 */
const describeControl = (control: PlaygroundControl, component?: string): ReactNode => {
  const target = getControlTarget(control, component);
  const group = control.group && control.group !== target?.component ? ` (${control.group})` : '';
  const shown = control.defaultValue === '' ? 'empty' : <Code>{String(control.defaultValue)}</Code>;
  if (target && !target.prop && control.type === 'boolean') {
    return (
      <>
        <Code>{target.component}</Code>
        {group}: included or left out. Shown: {control.defaultValue ? 'included' : 'left out'}.
      </>
    );
  }
  const name = target?.prop ? (
    <>
      <Code>{target.prop}</Code> on <Code>{target.component}</Code>
    </>
  ) : (
    <strong>{control.label ?? control.name}</strong>
  );
  return (
    <>
      {name}
      {group}: {getControlValues(control)}. Shown: {shown}.
    </>
  );
};

/**
 * Lists a playground's controls, plus the code for each option of controls that aren't a documented prop.
 * @param controls playground controls
 * @param component playground component for ungrouped controls
 * @param getCode gets the example code for a set of control values
 * @returns Markdown export content for the controls
 */
const getControlsMarkdown = (
  controls: PlaygroundControl[],
  component: string | undefined,
  getCode: (values: PlaygroundValues) => string
): ReactElement => {
  const variants = controls
    .filter((control) => !getControlTarget(control, component) && control.type !== 'number' && control.type !== 'text')
    .flatMap((control) => {
      const options = control.type === 'select' ? control.options : [true, false];
      return options
        .filter((option) => option !== control.defaultValue)
        .map((option) => ({ control, option, code: getCode({ [control.name]: option }) }));
    });
  return (
    <>
      <p>The interactive example has these controls. The code above uses the shown values.</p>
      <ul>
        {controls.map((control) => (
          <li key={control.name}>{describeControl(control, component)}</li>
        ))}
      </ul>
      {variants.map(({ control, option, code }) => (
        <React.Fragment key={`${control.name}-${String(option)}`}>
          <p>
            With <strong>{control.label ?? control.name}</strong> set to <Code>{String(option)}</Code>:
          </p>
          <pre>
            <code className="language-jsx">{code}</code>
          </pre>
        </React.Fragment>
      ))}
    </>
  );
};

const DEFAULT_PREVIEW_HEIGHT = 300;
const PREVIEW_ROOT_MARGIN = '600px 0px';

/**
 * Returns true once the element comes within PREVIEW_ROOT_MARGIN of the viewport.
 * @param ref
 * @returns whether the element has been near the viewport
 */
const useNearViewport = (ref: RefObject<HTMLElement | null>) => {
  const [isNear, setIsNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (isNear || !element) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIsNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: PREVIEW_ROOT_MARGIN }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [isNear, ref]);
  return isNear;
};

/**
 * Interactive chart example with S2 controls for a set of props and the matching JSX.
 * @param props
 * @returns playground element
 */
export const PropPlayground = ({ controls, render, replay, previewSize, component }: PropPlaygroundProps) => {
  const { colorMode } = useColorMode();
  const defaults = useMemo(() => getDefaults(controls), [controls]);
  const [values, setValues] = useState(defaults);
  const [mountKey, setMountKey] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const isNearViewport = useNearViewport(previewRef);

  const replayChart = () => {
    const preview = previewRef.current;
    // Hold the current height so the remount doesn't collapse the layout for a frame.
    if (preview) {
      preview.style.minHeight = `${preview.offsetHeight}px`;
      setTimeout(() => (preview.style.minHeight = ''), 1500);
    }
    setMountKey((key) => key + 1);
  };

  const changedValues = Object.fromEntries(
    Object.entries(values).map(([name, value]) => [name, value === defaults[name] ? undefined : value])
  );
  const element = render(changedValues);
  const previewElement = previewSize ? cloneElement(element, previewSize(element)) : element;
  const previewHeight = (previewElement.props as { height?: unknown }).height;
  const placeholderHeight = typeof previewHeight === 'number' ? previewHeight : DEFAULT_PREVIEW_HEIGHT;
  const groups = [...new Set(controls.map((control) => control.group ?? ''))];
  const getCode = (codeElement: ReactElement) =>
    `${getImportStatement(codeElement, S2_PACKAGE, LAB)}\n\n${elementToJsx(codeElement, datasets)}`;
  const code = getCode(element);

  return (
    <div className={styles.playground}>
      <div ref={previewRef} className={styles.preview}>
        <ClientOnly
          fallback={<div className={styles.fallback} />}
          markdown={null}
          noMarkdownReason="The example's code block is its Markdown export."
        >
          {() =>
            isNearViewport ? <div key={mountKey}>{previewElement}</div> : <div style={{ height: placeholderHeight }} />
          }
        </ClientOnly>
      </div>
      <ClientOnly
        fallback={<div className={styles.controls} />}
        {...(controls.length > 0
          ? { markdown: getControlsMarkdown(controls, component, (variantValues) => getCode(render(variantValues))) }
          : { markdown: null, noMarkdownReason: 'The example has no controls.' })}
      >
        {() => (
          <Provider colorScheme={colorMode} UNSAFE_className={styles.controls}>
            {groups.map((group) => (
              <div key={group} className={styles.group}>
                {group && <div className={styles.groupTitle}>{group}</div>}
                {controls
                  .filter((control) => (control.group ?? '') === group)
                  .map((control) => (
                    <ControlInput
                      key={control.name}
                      control={control}
                      value={values[control.name]}
                      isDisabled={control.isDisabled?.(values) ?? false}
                      contextualHelp={getContextualHelp(control, component)}
                      onChange={(value) => setValues((current) => ({ ...current, [control.name]: value }))}
                    />
                  ))}
              </div>
            ))}
            <div className={styles.actions}>
              {replay && (
                <ActionButton size="S" onPress={replayChart}>
                  Replay
                </ActionButton>
              )}
              {controls.length > 0 && (
                <ActionButton size="S" onPress={() => setValues(defaults)}>
                  Reset
                </ActionButton>
              )}
            </div>
          </Provider>
        )}
      </ClientOnly>
      <div className={styles.code}>
        <CodeBlock language="jsx">{code}</CodeBlock>
      </div>
    </div>
  );
};
