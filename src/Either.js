const utils = require('./internal/utils');

/**
 * @class Either
 * @abstract
 * 
 * A disjoint union of Left and Right, and is right-biased. `map` and `flatMap` are only called if it is a Right. 
 * This is similar to an Option, in that `Left : None :: Right : Some`. The difference is that a Left can also hold values.
 *
 * An Either does not hold two values. Rather, it holds one value, which is either a Left or a Right.
 */
class Either {

  constructor (val = null) {
    utils.abstractClassCheck(this, Either, "Either");
    this.val = val;
  }

  isLeft () {
    return this instanceof Left;
  }

  isRight () {
    return this instanceof Right;
  }

  /**
   * @private
   */
  get () {
    if (this.isRight()) {
      return this.val;
    }
    throw new Error("Performed a get on a Left");
  }

  /**
   * @private
   */
  getLeft () {
    if (this.isLeft()) {
      return this.val;
    }
    throw new Error("Performed a getLeft on a Right");
  }

  /**
   * Return a new Either based on running f.
   *
   * @example
   * Right("Barry")
   * .map((n) => n + " Bonds")
   * // => Right("Barry Bonds")
   * 
   * @param  {(A) => A} f 
   * @return {Either}
   */
  map (f) {
    if (this.isRight()) {
      return new Right(f(this.val));
    }
    return this;
  }

  /**
   * Return a new Either based on running f.
   *
   * @example
   * Right("Chuck")
   * .flatMap((n) => new Right(n + " Norris"))
   * // => Right("Chuck Norris")
   * 
   * @param  {(A) => Either} f
   * @return {Either}
   */
  flatMap (f) {
    if (this.isRight()) {
      return f(this.val);
    }
    return this;
  }

  /**
   * Compose on the left
   *
   * @example
   * Left("Chuck")
   * .map((n) => n + " Norris")
   * // => Left("Chuck Norris")
   *
   * @param  {(A) => A} f 
   * @return {Either}
   */
  mapLeft (f) {
    if (this.isLeft()) {
      return new Left(f(this.val));
    }
    return this;
  }

  /**
   * Compose on the left
   * @param  {(A) => Either} f
   * @return {Either}
   */
  flatMapLeft (f) {
    if (this.isLeft()) {
      return f(this.val);
    }
    return this;
  }


  /**
   * Cast this to a Right.
   * @return {Right}
   */
  toRight () {
    return new Right(this.val);
  }

  /**
   * Cast this to a Left.
   * @return {Left}
   */
  toLeft () {
    return new Left(this.val);
  }

  /**
   * If Left, switch to Right. If Right, switch to left.
   * @return {Either}
   */
  flip () {
    return this.isLeft() ? this.toRight() : this.toLeft();
  }


  getOrElse (f) {
    if (this.isRight()) {
      return this.get();
    }
    return f(this.getLeft());
  }

  /**
   * Helper for operations on options. Calling `match` is the same thing as chaining `map` and `getOrElse`.
   * 
   * @example
   * new Right(3).match({
   *   Right (a) { return a + 5; },
   *   Left () { return 0; }
   * });
   * // => 8
   */
  match ({ Left, Right }) {
    return this.map(Right).getOrElse(Left);
  }

  toJSON () {
    return this.val;
  }

}

Either.unit = function(v) {
  return new Right(v);
};

/**
 * Read in an either, given a Reads for the left, and a Reads for the right. 
 * If the reads for the right returns a Left, it will return the Reads for the left.
 *
 * @example
 * const readAsError = Reads.unit((v) => Right.unit(new Error(v)))
 * M.define({
 *   foo: Either.as(readAsError, M.number)
 * })
 * 
 * @param  {Reads} readLeft  The Reads for the left
 * @param  {Reads} readRight The Reads for the right
 * @return {Reads}
 */
Either.as = (readLeft, readRight) => {
  const Reads = require('./Reads');
  return new Reads((v) => {
    return readRight
      .map(Right.unit)
      .flatMapLeft(() => readLeft.getValue(v));
  });
};

/**
 * @class Left
 * @augments {Either}
 */
class Left extends Either {
  constructor (val) {
    super(val);
  }

  toString () {
    return `Left(${ this.val })`;
  }
}

Left.unit = (v) => new Left(v);

/**
 * @class Right
 * @augments {Either}
 */
class Right extends Either {
  constructor (val) {
    super(val);
  }

  toString () {
    return `Right(${ this.val })`;
  }
}

Right.unit = (v) => new Right(v);

module.exports = { Either, Left, Right };