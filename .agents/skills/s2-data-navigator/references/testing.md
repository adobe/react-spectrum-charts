# Testing

Run targeted: `yarn test:quiet --testPathPattern='dataNavigator|ccessibleNavigation|stability|interactionRetention|Legend|MultiField'`.

| Kind                                              | Where                                                                                                    |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Structure, rules, geometry, composition           | `dataNavigator/*.test.ts` — pure functions, no view                                                      |
| Session and controller                            | `navigationSession.test.ts`, `navigationController.test.ts` — real jsdom container, fake or real view    |
| Behavior through a real chart                     | `src/dev/<Chart>/Coverage/AccessibleNavigation/*.test.tsx`, rendering the matching `.story.tsx`          |
| Host updates (rebuilds, data changes, focus kept) | `Chart.accessibleNavigation.test.tsx`, `Chart.stability.test.tsx`, `Chart.interactionRetention.test.tsx` |
| Spec builder                                      | `accessibleNavigation/*.test.ts`, the mark's focus ring tests, `chartSpecBuilder.test.ts`                |

Behavior tests drive the real DOM the way a user does (see `LegendNavigation.test.tsx`):

- click `.dn-entry-button` to enter, then `fireEvent.keyDown` on the focused `.dn-node` with both `key` and `code` (`key: ' '` for Space)
- assert the focused node's name from its `.dn-node-text` `aria-label`
- assert visible effects through the chart (dimmed marks, the tooltip element, popovers, callbacks), not internal signals, where possible

`harness.settle()` in `test-utils/chartStability.tsx` waits for embeds, dataflow and animations; an axis title currently keeps it from settling in jsdom.
