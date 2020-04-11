import { Point2d } from '../src/index'

describe('math2d', () => {
  describe('Point2d', () => {
    describe('add', () => {
      test('(0 0) + (0 0)', () => {
        expect(Point2d.add(new Point2d(0, 0), new Point2d(0, 0))).toEqual(
          new Point2d(0, 0)
        )
      })
    })

    describe('distanceSq', () => {
      test('Squared distance of (0, 0) to (0, 0)', () => {
        expect(
          Point2d.distanceSq(new Point2d(0, 0), new Point2d(0, 0))
        ).toEqual(0)
      })
    })
  })
})
