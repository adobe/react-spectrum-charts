# Architecture: File Creation Conventions

Read this when: creating any new `.ts`/`.tsx` source file.

---

**Copyright header** — Every new `.ts` or `.tsx` source file must start with the Apache 2.0 copyright block. ESLint enforces this as an error; the build will fail without it. Excluded: `.story.tsx` files, test-utils, docs files.

```ts
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
```

**No `import React`** — The project uses the JSX runtime transform (`plugin:react/jsx-runtime`). Do not add `import React from 'react'` to `.tsx` files; it is not needed and ESLint will flag it as an unused import.

**No duplicate imports** — ESLint enforces `no-duplicate-imports: 'error'`. If you need multiple named imports from the same module, combine them into a single import statement.

**`ScSpec` not `Spec`** — All spec builder `produce<>` calls must use `ScSpec` (the project's extension of Vega's `Spec`) as the return type. `ScSpec` carries project-specific `usermeta` constraints that Vega's bare `Spec` does not express. Pattern: `produce<ScSpec, [MarkOptions]>((spec, options) => { ... })`.

**Type literals over bare strings** — When defining prop types that take a fixed set of values, use a string literal union (`'last' | 'first' | 'average'`). Do not add `| string` to widen the union — restrict to known valid values only.
