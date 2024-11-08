export default class Utils {
    static range(start: number, stop: number, step: number = 1)  {
        return Array(Math.ceil((stop - start) / step)).fill(start).map((x, y) => x + y * step)
    }
}