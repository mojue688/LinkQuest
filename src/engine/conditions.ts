/**
 * 条件求值：在给定 GameState 下对 Condition / ConditionGroup 求值。
 */
import { CompareOp, type Condition, type ConditionGroup, type GameState } from '@/types/adventure'

/** 读取变量当前值 */
export function getVariable(
  state: GameState,
  key: string
): number | string | boolean | undefined {
  return state.variables[key]
}

/** 比较两个值 */
function compare(
  left: number | string | boolean | undefined,
  op: CompareOp,
  right: number | string | boolean
): boolean {
  if (left === undefined) return false
  switch (op) {
    case CompareOp.Eq:
      return left === right
    case CompareOp.NotEq:
      return left !== right
    case CompareOp.Gt:
      return (left as number) > (right as number)
    case CompareOp.Gte:
      return (left as number) >= (right as number)
    case CompareOp.Lt:
      return (left as number) < (right as number)
    case CompareOp.Lte:
      return (left as number) <= (right as number)
    default:
      return false
  }
}

/** 求值单个原子条件 */
export function evalCondition(state: GameState, cond: Condition): boolean {
  const left = getVariable(state, cond.variableKey)
  return compare(left, cond.op, cond.value)
}

/** 求值复合条件组（and / or 递归） */
export function evalConditionGroup(
  state: GameState,
  group: ConditionGroup
): boolean {
  if (group.logic === 'and') {
    return group.items.every((item) =>
      'logic' in item
        ? evalConditionGroup(state, item)
        : evalCondition(state, item)
    )
  }
  return group.items.some((item) =>
    'logic' in item
      ? evalConditionGroup(state, item)
      : evalCondition(state, item)
  )
}

/** 条件组可能为空，空视为恒真 */
export function evalOptionalCondition(
  state: GameState,
  group?: ConditionGroup
): boolean {
  if (!group) return true
  return evalConditionGroup(state, group)
}
