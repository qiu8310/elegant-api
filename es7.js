// function-bind
let log = ::console.log;
let obj = {name: 'function-bind'};
let sayName = () => {
  return this.name;
};
obj::sayName();


// object-rest-spread
let obj2 = {x: 1, y: 2, z: 3};
let {x, ...rest} = obj2;
let newObj = {x: 0, ...rest};


// decorators ＝> 还不支持，会报错： Decorators are not supported yet in 6.x pending proposal update.
// @annotation
// @addName('es7')
class ES7 {

  // class-properties
  static staticProp = 1;
  propA = 1;
  propB;

  constructor() {
    console.log(this.propA === this.constructor.staticProp);
  }

  method() {
    return this.propB;
  }

  static staticMethod() {
    console.log('I\'m static');
  }
}


function annotation(component) {
  component.annotated = true;
}

function addName(config) {
  return (component) => {
    component.name = config;
  }
}

