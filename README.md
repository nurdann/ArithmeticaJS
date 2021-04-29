# Arithmetic parser

## Grammar

We can start with the following grammar using the same ideas from [the implementation in Haskell](https://github.com/nurdann/ArithmeticaHS),
```
Expr -> Expr + Term | Expr - Term | Term
Term -> Term * Factor | Term / Factor | Factor
Factor -> ( Expr ) | Number
Number -> [0-9]+
```
where capitalized word indicates a non-terminal expression and lower-case words indicate a terminal symbol.

Then we eliminate left-recursion,
```
Expr -> Term Expr'
Expr' -> + Term Expr' | - Term Expr'
Term -> Factor Term'
Term' -> * Factor Term' | / Factor Term'
Factor -> ( Expr ) | Number
Number -> [0-9]+
```

Let's compute set of first symbols for each non-terminal expression,
```
FIRST(Expr) = { (, [0-9] }
FIRST(Expr') = { +, - }
FIRST(Term) = { (, -, [0-9] }
FIRST(Term') = { *, / }
FIRST(Factor) = { (, [0-9]}
```

Since expressions with more than one possible production, i.e. `Expr', Term', Factor`, have disjoint set of first symbols, we can use a lookahead symbol to determine a production (Section 4.4.2 from [Aho et al.](https://www.pearson.com/us/higher-education/program/Aho-Compilers/PGM2809377.html)).

## JS Implemention

We can use stack to preserve the order of operations. The method is to accumulate digits inside a `buffer` string and when an operator `op` is matched as a current symbol we have a form `Term termOp | buffer op` where `Term termOp` is a partial expression. So then, we create a new partial expression `(Term termOp buffer) op`. And keep doing so until a factor operator is reached, if the partial expression has term operators `+` or `-`, then that expression is pushed to the stack and the expression is assigned to `Factor op`. The expressions pushed to the stack are left side expressions, e.g. `3*` is the left side of the binary operator `*` in `3*(5+2)` inclusive. So we are essentially employing bottom-up parser.