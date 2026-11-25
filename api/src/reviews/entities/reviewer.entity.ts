/** Mock reviewer; the brief allows a fixed list instead of real auth. */
export class Reviewer {
  id!: string;
  name!: string;

  constructor(props: Reviewer) {
    Object.assign(this, props);
  }
}
