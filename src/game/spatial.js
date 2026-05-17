import { BUCKET_HEIGHT } from './config.js';

// 1-D y-axis bucket. Zombies only descend, so each bullet only checks ~3 buckets.
// Cheaper than a quadtree, ~free to maintain.
export class YBucket {
  constructor() {
    this.buckets = new Map();
  }
  clear() {
    this.buckets.clear();
  }
  insert(item) {
    const key = (item.y / BUCKET_HEIGHT) | 0;
    let arr = this.buckets.get(key);
    if (!arr) {
      arr = [];
      this.buckets.set(key, arr);
    }
    arr.push(item);
  }
  forNear(y, radius, fn) {
    const minKey = ((y - radius) / BUCKET_HEIGHT) | 0;
    const maxKey = ((y + radius) / BUCKET_HEIGHT) | 0;
    for (let k = minKey; k <= maxKey; k++) {
      const arr = this.buckets.get(k);
      if (!arr) continue;
      for (let i = 0; i < arr.length; i++) fn(arr[i]);
    }
  }
}
