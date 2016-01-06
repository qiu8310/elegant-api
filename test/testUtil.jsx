import assert from 'assert';
import util from '../src/util';


describe('util', () => {


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
  });

  context('urlParams', () => {
    it('should serialize query object', () => {
      util.urlParams({a: 'a', b: null}).should.eql('a=a&b=');
    });

    it('should serialize query object include array', () => {
      util.urlParams({a: ['1', '2']}).should.eql('a%5B%5D=1&a%5B%5D=2');
    });

    it('should serialize query object include object', () => {
      util.urlParams({a: {a1: '1'}}).should.eql('a%5Ba1%5D=1');
    });

    it('should serialize special array items (jQuery.serialize generated)', () => {
      util.urlParams([{name: 'a', value: 'aa'}, {name: 'b', value: 'bb'}]).should.eql('a=aa&b=bb');
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

});
