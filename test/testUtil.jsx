import assert from 'assert';
import * as util from '../src/libs/util';


describe('util', () => {

  context('emptyFunction', () => {
    it('should be a function', () => {
      (typeof util.emptyFunction).should.eql('function');
    });
    it('should return undefined', () => {
      assert.equal(util.emptyFunction(), undefined);
    });
  });

  context('objectify', () => {
    it('should return itself when argument is object', () => {
      let arg = {a: 'a'};
      assert.equal(util.objectify(arg), arg);
    });

    it('should return a object when argument is not', () => {
      assert.deepEqual(util.objectify(function () {}), {});
      assert.deepEqual(util.objectify(null), {});
      assert.deepEqual(util.objectify(false), {});
      assert.deepEqual(util.objectify(3), {});
    });
  });

  context('each', () => {
    it('should iterate array', () => {
      let obj = {a: 'aa', b: 'bb'};
      let count = 0;
      util.each(obj, (val, key) => {
        count++;
        obj[key].should.eql(val);
      });
      count.should.eql(2);
    });
    it('should iterate object', () => {
      let arr = ['a', true, 3];
      let count = 0;

      util.each(arr, (val, i) => {
        arr[i].should.eql(val);
        count++;
      });

      count.should.eql(arr.length);
    });

    it('should not iterate others', () => {
      let count = 0;
      util.each(null, (val, key) => count++);
      util.each(true, (val, key) => count++);
      util.each(400, (val, key) => count++);
      count.should.eql(0);
    });
  });

  context('mapObject', () => {
    it('should map object', () => {
      let obj = {foo: 'fv', bar: 'bv'};

      let result = util.mapObject(obj, (val, key, obj) => {
        return val + '_' + key;
      });

      assert.deepEqual(result, {foo: 'fv_foo', bar: 'bv_bar'});
    });
  });

  context('deepClone', () => {
    it('should deep clone object', () => {
      let inner = {a: 'aa', b: true};
      assert.notEqual(util.deepClone({inner}).inner, inner);
      assert.deepEqual(util.deepClone({inner}).inner, inner);
    });

    it('should deep clone array', () => {
      let inner = [1, 2, {a: 'aa'}];
      assert.notEqual(util.deepClone([inner])[0], inner);
      assert.deepEqual(util.deepClone([inner])[0], inner);
    });

    it('shold not clone others', () => {
      assert.equal(util.deepClone(null), null);
      assert.equal(util.deepClone(true), true);
      assert.equal(util.deepClone(util.emptyFunction), util.emptyFunction);
    });
  });

  context('extend', () => {

    it('should create a new src target when src is not a object', () => {
      let src = null;
      let target = {a: 'aaa'};

      assert.notEqual(util.extend(src, target), target);
      assert.deepEqual(util.extend(src, target), target);
    });

    it('should ignore none object target', () => {
      let src = {a: 'aaa'};
      assert.equal(util.extend(src, null, false), src);
    });

    it('should only extend own property, not the property in prototype', () => {
      let target = {a: 'aaa'};
      Object.prototype.b = 'bbb';
      assert.ok('b' in target);

      assert.deepEqual(util.extend({}, target), target);

      delete Object.prototype.b;
    });

    it('should deep extend when enabled', () => {
      let target = {ab: {b: 'b'}};

      assert.deepEqual(util.extend({ab: {a: 'a'}}, target), {ab: {b: 'b'}});
      assert.deepEqual(util.extend(true, {ab: {a: 'a'}}, target), {ab: {a: 'a', b: 'b'}});
    });

    it('should deep extend target property when src has not it', () => {
      let inner = {a: 'aa'};
      assert.deepEqual(util.extend(true, {}, {foo: {bar: inner}}).foo.bar, inner);
      assert.notEqual(util.extend(true, {}, {foo: {bar: inner}}).foo.bar, inner);

      assert.deepEqual(util.extend(true, {}, {foo: inner}).foo, inner);
      assert.notEqual(util.extend(true, {}, {foo: inner}).foo, inner);
    });

    it('should extend array', () => {
      assert.deepEqual(util.extend(['a'], [1, 2]), [1, 2]);
      assert.deepEqual(util.extend(['a', 'b', 'c'], [1, 2]), [1, 2, 'c']);
    });

    it('should deep extend array', () => {
      let inner = [1, 2];
      assert.deepEqual(util.extend(true, {}, {foo: inner}).foo, inner);
      assert.notEqual(util.extend(true, {}, {foo: inner}).foo, inner);
    });

  });

  context('buildQuery', () => {
    it('should serialize query object', () => {
      util.buildQuery({a: 'a', b: null}).should.eql('a=a&b=');
    });

    it('should serialize query object include array', () => {
      util.buildQuery({a: ['1', '2']}).should.eql('a%5B%5D=1&a%5B%5D=2');
    });

    it('should serialize query object include object', () => {
      util.buildQuery({a: {a1: '1'}}).should.eql('a%5Ba1%5D=1');
    });

    it('should serialize special array items (jQuery.serialize generated)', () => {
      util.buildQuery([{name: 'a', value: 'aa'}, {name: 'b', value: 'bb'}]).should.eql('a=aa&b=bb');
    });
  });

  context('urlNormalize', () => {
    it('should not break a normal url', () => {
      let good1 = 'http://abc.com',
        good2 = 'https://abc.com?a=aa&b=dk#hash=kjas',
        good3 = '//abc.com';
      util.urlNormalize(good1).should.eql(good1);
      util.urlNormalize(good2).should.eql(good2);
      util.urlNormalize(good3).should.eql(good3);
    });

    it('should git rid of extra slash', () => {
      util.urlNormalize('http://abc.com//api', 'http://abc.com/api');
      util.urlNormalize('//abc.com//api', '//abc.com/api');
    });
  });


  context('appendQuery', () => {
    it('should append empty string', () => {
      util.appendQuery('http://a.com', '').should.eql('http://a.com');
    });

    it('should append to no query url', () => {
      util.appendQuery('a.com', 'a=a&b=b').should.eql('a.com?a=a&b=b');
    });

    it('should append to has query url', () => {
      util.appendQuery('a.com?a=a', 'b=b').should.eql('a.com?a=a&b=b');
    });

    it('should append to hash url', () => {
      util.appendQuery('a.com#hash', 'a=a').should.eql('a.com?a=a#hash');
    });
  });


});
