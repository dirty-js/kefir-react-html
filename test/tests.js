import * as Kefir from "kefir"
import * as R     from "ramda"
import Atom       from "kefir.atom"

import React    from "react"
import ReactDOM from "react-dom/server"

import K, {bind, bindProps, classes, fromIds, fromKefir} from "../src/kefir.react.html"

function show(x) {
  switch (typeof x) {
    case "string":
    case "object":
      return JSON.stringify(x)
    default:
      return `${x}`
  }
}

const testEq = (expr, expect) => it(`${expr} => ${show(expect)}`, done => {
  const actual = eval(`(Atom, K, Kefir, R, bind, bindProps, classes) => ${expr}`)(Atom, K, Kefir, R, bind, bindProps, classes)
  const check = actual => {
    if (!R.equals(actual, expect))
      throw new Error(`Expected: ${show(expect)}, actual: ${show(actual)}`)
    done()
  }
  if (actual instanceof Kefir.Observable)
    actual.take(1).onValue(check)
  else
    check(actual)
})

const testRender = (vdom, expect) => it(`${expect}`, () => {
  const actual = ReactDOM.renderToStaticMarkup(vdom)

  if (actual !== expect)
    throw new Error(`Expected: ${show(expect)}, actual: ${show(actual)}`)
})

describe("K", () => {
  testEq('K()', [])
  testEq('K("a")', ["a"])
  testEq('K("a", Kefir.constant("b"))', ["a", "b"])

  testEq('K("a", x => x + x)', "aa")
  testEq('K(Kefir.constant("a"), Kefir.constant(x => x + x))', "aa")

  testEq('K([1, {y: {z: Kefir.constant("x")}}, Kefir.constant(3)], R.prepend(4))', [4, 1, {y: {z: "x"}}, 3])
})

describe("K.elems", () => {
  testRender(<K.p>Just testing <K.span>constants</K.span>.</K.p>,
             '<p>Just testing <span>constants</span>.</p>')

  testRender(<K.div onClick={() => {}}
                    style={{display: "block",
                            color: Kefir.constant("red")}}>
               {fromIds(Kefir.constant(["Hello"]), id =>
                        <span key={id}>{id}</span>)}
             </K.div>,
             '<div style="display:block;color:red;"><span>Hello</span></div>')

  testRender(<K.a href="#lol" style={Kefir.constant({color: "red"})}>
               {Kefir.constant("Hello")} {Kefir.constant("world!")}
             </K.a>,
             '<a href="#lol" style="color:red;">Hello world!</a>')
})

describe("bind", () => {
  testEq('{const a = Atom(1);' +
         ' const e = {a: 2};' +
         ' const x = bind({a});' +
         ' x.onChange({target: e});' +
         ' return a}',
         2)
})

describe("bindProps", () => {
  testEq('{const a = Atom(1);' +
         ' const e = {a: 2};' +
         ' const x = bindProps({mount: "onChange", a});' +
         ' x.mount(e);' +
         ' a.set(3);' +
         ' return e.a}',
         3)

  testEq('{const a = Atom(1);' +
         ' const e = {a: 2};' +
         ' const x = bindProps({mount: "onChange", a});' +
         ' x.mount(e);' +
         ' e.a = 3;' +
         ' x.onChange({target: e});' +
         ' return a}',
         3)
})

describe("classes", () => {
  testEq('classes()', {className: ""})

  testEq('classes("a")', {className: "a"})

  testEq('classes("a", undefined, 0, false, "", "b")',
         {className: "a b"})

  testEq('K(classes("a", Kefir.constant("b")), R.identity)',
         {className: "a b"})
})

describe("fromKefir", () => {
  testRender(fromKefir(Kefir.constant(<p>Yes</p>)), '<p>Yes</p>')
})
