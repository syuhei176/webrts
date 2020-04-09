export class Point2d {
  constructor(public x: number, public y: number) {}
  static zero() {
    return new Point2d(0, 0)
  }

  static sub(a: Point2d, b: Point2d) {
    return new Point2d(a.x - b.x, a.y - b.y)
  }

  static add(a: Point2d, b: Point2d) {
    return new Point2d(a.x + b.x, a.y + b.y)
  }

  static times(a: Point2d, t: number) {
    return new Point2d(a.x * t, a.y * t)
  }

  sub(b: Point2d) {
    return Point2d.sub(this, b)
  }

  add(b: Point2d) {
    return Point2d.add(this, b)
  }

  times(t: number) {
    return Point2d.times(this, t)
  }

  setLocation(x: number, y: number) {
    this.x = x
    this.y = y
  }

  distanceSq(px: number, py: number): number {
    px -= this.x
    py -= this.y
    return px * px + py * py
  }

  static distanceSq(p: Point2d, q: Point2d): number {
    const xx = p.x - q.x
    const yy = p.y - q.y
    return xx * xx + yy * yy
  }

  static distance(p, q) {
    return Math.sqrt(Point2d.distanceSq(p, q))
  }

  distance() {
    return Point2d.distance(Point2d.zero, this)
  }
}

/**
 * @name Line2d
 */
export class Line2d {
  constructor(
    public x1: number,
    public y1: number,
    public x2: number,
    public y2: number
  ) {}

  setLine(x1: number, y1: number, x2: number, y2: number) {
    this.x1 = x1
    this.y1 = y1
    this.x2 = x2
    this.y2 = y2
  }

  getP1() {
    return new Point2d(this.x1, this.y1)
  }

  getP2() {
    return new Point2d(this.x2, this.y2)
  }

  getBounds2D() {
    let x
    let y
    let w
    let h
    if (this.x1 < this.x2) {
      x = this.x1
      w = this.x2 - this.x1
    } else {
      x = this.x2
      w = this.x1 - this.x2
    }
    if (this.y1 < this.y2) {
      y = this.y1
      h = this.y2 - this.y1
    } else {
      y = this.y2
      h = this.y1 - this.y2
    }
    return new Rectangle2D(x, y, w, h)
  }

  getConnect(l: Line2d) {
    const dBunbo =
      (this.x2 - this.x1) * (l.y2 - l.y1) - (this.y2 - this.y1) * (l.x2 - l.x1)

    if (0 == dBunbo) {
      return null
    }

    const vectorAC = new Point2d(l.x1 - this.x1, l.y1 - this.y1)

    const dR =
      ((l.y2 - l.y1) * vectorAC.x - (l.x2 - l.x1) * vectorAC.y) / dBunbo

    return new Point2d(
      this.x1 + dR * (this.x2 - this.x1),
      this.y1 + dR * (this.y2 - this.y1)
    )
  }

  static relativeCCW(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    px: number,
    py: number
  ) {
    x2 -= x1
    y2 -= y1
    px -= x1
    py -= y1
    let ccw = px * y2 - py * x2
    if (ccw == 0.0) {
      ccw = px * x2 + py * y2
      if (ccw > 0.0) {
        px -= x2
        py -= y2
        ccw = px * x2 + py * y2
        if (ccw < 0.0) {
          ccw = 0.0
        }
      }
    }
    if (ccw < 0.0) {
      return -1
    } else {
      if (ccw > 0.0) {
        return 1
      } else {
        return 0
      }
    }
  }

  relativeCCW(px: number, py: number) {
    return Line2d.relativeCCW(this.x1, this.y1, this.x2, this.y2, px, py)
  }

  relativeCCWByPoint2d(p: Point2d) {
    return Line2d.relativeCCW(this.x1, this.y1, this.x2, this.y2, p.x, p.y)
  }

  static linesIntersect(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number
  ) {
    return (
      Line2d.relativeCCW(x1, y1, x2, y2, x3, y3) *
        Line2d.relativeCCW(x1, y1, x2, y2, x4, y4) <=
        0 &&
      Line2d.relativeCCW(x3, y3, x4, y4, x1, y1) *
        Line2d.relativeCCW(x3, y3, x4, y4, x2, y2) <=
        0
    )
  }

  intersectsLine(x1: number, y1: number, x2: number, y2: number) {
    return Line2d.linesIntersect(
      x1,
      y1,
      x2,
      y2,
      this.x1,
      this.y1,
      this.x2,
      this.y2
    )
  }

  static ptSegDistSq(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    px: number,
    py: number
  ) {
    x2 -= x1
    y2 -= y1
    px -= x1
    py -= y1
    let dotprod = px * x2 + py * y2
    let projlenSq
    if (dotprod <= 0.0) {
      projlenSq = 0.0
    } else {
      px = x2 - px
      py = y2 - py
      dotprod = px * x2 + py * y2
      if (dotprod <= 0.0) {
        projlenSq = 0.0
      } else {
        projlenSq = (dotprod * dotprod) / (x2 * x2 + y2 * y2)
      }
    }
    let lenSq = px * px + py * py - projlenSq
    if (lenSq < 0) {
      lenSq = 0
    }
    return lenSq
  }

  static ptSegDist(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    px: number,
    py: number
  ) {
    return Math.sqrt(Line2d.ptSegDistSq(x1, y1, x2, y2, px, py))
  }

  ptSegDist(px: number, py: number) {
    return Line2d.ptSegDist(this.x1, this.y1, this.x2, this.y2, px, py)
  }

  ptSegDistSq(px: number, py: number) {
    return Line2d.ptSegDistSq(this.x1, this.y1, this.x2, this.y2, px, py)
  }

  static ptLineDistSq(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    px: number,
    py: number
  ) {
    x2 -= x1
    y2 -= y1
    px -= x1
    py -= y1
    const dotprod = px * x2 + py * y2
    const projlenSq = (dotprod * dotprod) / (x2 * x2 + y2 * y2)
    let lenSq = px * px + py * py - projlenSq
    if (lenSq < 0) {
      lenSq = 0
    }
    return lenSq
  }

  static ptLineDist = function(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    px: number,
    py: number
  ) {
    return Math.sqrt(Line2d.ptLineDistSq(x1, y1, x2, y2, px, py))
  }

  ptLineDistSq(px: number, py: number) {
    return Line2d.ptLineDistSq(this.x1, this.y1, this.x2, this.y2, px, py)
  }

  ptLineDist(px: number, py: number) {
    return Line2d.ptLineDist(this.x1, this.y1, this.x2, this.y2, px, py)
  }
}

export class Rectangle2D {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number
  ) {}

  contains(x: number, y: number) {
    const x0 = this.x
    const y0 = this.y
    return x >= x0 && y >= y0 && x < x0 + this.width && y < y0 + this.height
  }

  static contains = function(rect: Rectangle2D, p: Point2d) {
    return (
      p.x >= rect.x &&
      p.y >= rect.y &&
      p.x < rect.x + rect.width &&
      p.y < rect.y + rect.height
    )
  }
}
