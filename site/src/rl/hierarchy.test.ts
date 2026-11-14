import { describe, expect, it } from 'vitest'
import {
  DOORS,
  GOAL,
  LANDMARKS,
  OPEN_CELLS,
  ROOM,
  START,
  WASTED,
  averageLengths,
  cellOf,
  execute,
  flatSuccess,
  hierarchicalSuccess,
  medianFirstGoal,
  roomsOf,
  shortestPath,
  wander,
  withinReach,
} from './hierarchy'

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

describe('four rooms', () => {
  it('has 104 open cells, four rooms and four doorways', () => {
    expect(OPEN_CELLS).toHaveLength(104)
    expect(new Set(OPEN_CELLS.map((c) => ROOM[c]).filter((r) => r >= 0)).size).toBe(4)
    expect(DOORS.map((d) => roomsOf(d))).toEqual([
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
    ])
  })
  it('the goal is diagonally opposite the start, 17 steps away at best', () => {
    expect(ROOM[START]).toBe(0)
    expect(ROOM[GOAL]).toBe(3)
    expect(shortestPath()).toBe(17)
  })
})

describe('what each kind of choice does', () => {
  it('a subgoal within reach is walked to by the shortest route', () => {
    const out = execute('subgoals', START, 0, 0.95, 1000) // the top door, from the start
    expect(out.cell).toBe(DOORS[0])
    expect(out.steps).toBe(7)
  })
  it('a subgoal out of reach wastes time and goes nowhere', () => {
    expect(withinReach(START, LANDMARKS.indexOf(GOAL))).toBe(false)
    const out = execute('subgoals', START, LANDMARKS.indexOf(GOAL), 0.95, 1000)
    expect(out.cell).toBe(START)
    expect(out.steps).toBe(WASTED)
  })
  it('from a doorway, both rooms it joins are within reach', () => {
    expect(withinReach(DOORS[2], LANDMARKS.indexOf(GOAL))).toBe(true)
    expect(withinReach(DOORS[2], 4)).toBe(false)
  })
  it('a door-seeking skill works from anywhere', () => {
    expect(execute('doors', cellOf(11, 11), 4, 0.95, 1000).cell).toBe(DOORS[0])
  })
})

describe('three agents in four rooms (numbers quoted in the Week 14 lesson)', () => {
  it('wandering at random: subgoals find the goal soonest, door skills latest', () => {
    expect(medianFirstGoal('flat', 41)).toBe(531)
    expect(medianFirstGoal('doors', 41)).toBe(2737)
    expect(medianFirstGoal('subgoals', 41)).toBe(193)
  })
  it('the single run the playground opens on', () => {
    expect(wander('flat', 500, 500).firstGoal).toBe(258)
    expect(wander('doors', 500, 500).firstGoal).toBeNull()
    expect(wander('subgoals', 500, 500).firstGoal).toBe(207)
  })
  const flat = averageLengths('flat', 60, 20)
  const doors = averageLengths('doors', 60, 20)
  const subgoals = averageLengths('subgoals', 60, 20)
  it('the first episode', () => {
    expect(flat[0]).toBeCloseTo(784, 0)
    expect(doors[0]).toBeCloseTo(4529, 0)
    expect(subgoals[0]).toBeCloseTo(230, 0)
  })
  it('by the tenth episode both skilled agents are near the shortest path; the flat one is not', () => {
    expect(flat[9]).toBeCloseTo(433, 0)
    expect(doors[9]).toBeCloseTo(26, 0)
    expect(subgoals[9]).toBeCloseTo(21, 0)
  })
  it('total steps over 60 episodes', () => {
    expect(Math.round(sum(flat))).toBe(11669)
    expect(Math.round(sum(doors))).toBe(8635)
    expect(Math.round(sum(subgoals))).toBe(1807)
  })
})

describe('reliability of long tasks', () => {
  it('99% per step is 13% over 200 steps', () => {
    expect(flatSuccess(0.99, 200)).toBeCloseTo(0.134, 3)
    expect(flatSuccess(0.99, 1000)).toBeLessThan(0.0001)
  })
  it('cutting into pieces changes nothing by itself', () => {
    expect(hierarchicalSuccess(0.99, 200, 10, 0)).toBeCloseTo(flatSuccess(0.99, 200), 10)
  })
  it('being able to redo a failed piece changes everything', () => {
    expect(hierarchicalSuccess(0.99, 200, 10, 1)).toBeCloseTo(0.714, 3)
    expect(hierarchicalSuccess(0.99, 200, 10, 2)).toBeCloseTo(0.941, 3)
    expect(hierarchicalSuccess(0.99, 1000, 50, 2)).toBeCloseTo(0.739, 3)
    expect(flatSuccess(0.999, 200)).toBeCloseTo(0.819, 3)
  })
  it('the subgoal route from start to goal is three decisions', () => {
    expect(withinReach(START, 0)).toBe(true)
    expect(withinReach(DOORS[0], 2)).toBe(true)
    expect(withinReach(DOORS[2], LANDMARKS.indexOf(GOAL))).toBe(true)
    expect(execute('subgoals', START, 0, 1, 99).steps + execute('subgoals', DOORS[0], 2, 1, 99).steps + execute('subgoals', DOORS[2], 8, 1, 99).steps).toBe(17)
  })
})
