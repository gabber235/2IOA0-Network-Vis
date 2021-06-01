

export class Some<A> {
    readonly content: A
    readonly isNone: false = false
    readonly isSome: true = true

    constructor(a:A) {
        this.content = a
    }
    withDefault(def: A): A {
        return this.content
    }
    map<B>(f: (a:A) => B): Maybe<B> {
        return new Some(f(this.content))
    }
    andThen<B>(f: (a:A) => Maybe<B>): Maybe<B> {
        return f(this.content)
    }
}

export class None<A> {
    readonly isNone: true = true
    readonly isSome: false = false

    withDefault(def: A): A {
        return def
    }
    map<B>(f: (a:A) => B): Maybe<B> {
        return new None()
    }
    andThen<B>(f: (a:A) => Maybe<B>): Maybe<B> {
        return new None()
    }
}

export type Maybe<A> = Some<A> | None<A>
