/**
 * Shiba 애니메이션 타입 (24개 모두)
 * - 짧은 이름 (권장): attack, idle, walk 등
 * - 전체 경로: animalarmature|attack 등
 */
export type ShibaAnimationType =
  | 'Attack' // 물어
  | 'Death' // 죽은척
  | 'Eating' // 먹어
  | 'Gallop' // 뛰어
  | 'Gallopjump' // 뛰면서 점프
  | 'Idlehitreactleft' // 완쪽 반응
  | 'Idlehitreactright' // 오른쪽 반응
  | 'Jumptoidle' // 점프 후 대기
  | 'Walk' // 걸어
  | 'Idle2headlow' // 대기3
  | 'Idle2' // 대기2
  | 'Idle'; // 대기1

/**
 * Shiba 상태 머신 타입
 */
export type ShibaState =
  | 'resting' // 가만히 있을 때: eating , idle2headlow, idle2, idle, death
  | 'moving' // 움직일 때: gallop, gallopjump, walk
  | 'catching' // 잡을 때: jumptoidle, attack
  | 'movingLeft' // 왼쪽으로 움직일 때: idlehitreactleft
  | 'movingRight'; // 오른쪽으로 움직일 때: idlehitreactright
