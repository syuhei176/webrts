const mockMatrix = jest.fn().mockImplementation(() => {
  return {
    translate: () => {}
  }
})
jest.mock(
  'svg.js',
  jest.fn().mockImplementation(() => {
    return {
      Matrix: mockMatrix
    }
  })
)
import { Camera } from '../src/Camera'
import { RectangleSelector } from '../src/ui/RectangleSelector'
import { Point2d } from '@webrts/math2d'

const mockElement = jest.fn().mockImplementation(() => {
  return {
    add: () => {},
    move: () => mockElement(),
    attr: () => mockElement(),
    matrix: () => {},
    mousedown: () => {},
    mousemove: () => {},
    mouseup: () => {},
    on: () => {}
  }
})
const mockSVG = jest.fn().mockImplementation(() => {
  return {
    group: () => mockElement(),
    rect: () => mockElement(),
    on: () => {}
  }
})

describe('Camera', () => {
  let camera: Camera
  beforeEach(() => {
    const doc = mockSVG()
    camera = new Camera(doc, new RectangleSelector(doc))
  })

  describe('move', () => {
    test('move camera position with (10 10)', () => {
      expect(camera.screen2global(10, 10)).toEqual(new Point2d(10, 10))
      expect(camera.global2screen(new Point2d(10, 10))).toEqual(
        new Point2d(10, 10)
      )
      camera.move(10, 10)
      expect(camera.screen2global(10, 10)).toEqual(new Point2d(0, 0))
      expect(camera.global2screen(new Point2d(10, 10))).toEqual(
        new Point2d(20, 20)
      )
    })
  })
})
