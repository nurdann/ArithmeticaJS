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

Then we eliminate left-recursion with the introduction of additional rule that has an empty production `Epsilon`,
```
Expr -> Term Expr'
Expr' -> + Term Expr' | - Term Expr' | Epsilon
Term -> Factor Term'
Term' -> * Factor Term' | / Factor Term' | Epsilon
Factor -> ( Expr ) | Number
Number -> [0-9]+
```

The above grammar belongs to the class of LL(`k`) grammars where LL stands for Left-to-right Left-most derivation of grammar, and `k` determines number of characters/terminals needed to determine next rule production so it is called predictive parsing. In our case `k=1` because one character is enough to determine the next production rule.

From the above grammar we can compute `FIRST(X)` AND `FOLLOW(X)` sets of characters that are appear before and after the rule is produced, respectively. 

Let find first symbols for `Expr`, the first rule is `Term` whose first rule is `Factor`. So, their set of first symbols is equivalent because we can expand them as `Expr => Term Expr' => Factor Term'`.

```
FIRST(Expr) = FIRST(Term) = FIRST(Factor) = { (, [0-9] }
FIRST(Expr') = { +, -, Epsilon }
FIRST(Term') = { *, /, Epsilon} 
```

To compute `FOLLOW(X)` symbols we need to look for production rules where `X` appears. First, we imagine that the top-most expression has a symbol `$` to indicate end of string, i.e `Expr $`, so `$` is in the set `FOLLOW(Expr)`. Furthermore, we see that `Expr` appears in `Factor -> ( Expr )` so `)` is also in the set `FOLLOW(Expr)`.

For the set `FOLLOW(Term)`, `Term` can be be always expanded as `Factor Term'` so `FOLLOW(Term) = FOLLOW(Term')`. In the rule for `Expr'`, `Term` is followed by `Expr'` so `FIRST(Expr') \ { Epsilon }` is in the set `FOLLOW(Term)`, i.e `{ +, - }` in `FOLLOW(Term)`. In the rule `Expr`, `Expr'` has an Epsilon-production so it can be expressed as `Expr -> Term Epsilon`, or equivalently `Expr -> Term`. Thus, `FOLLOW(Expr)` is subset of `FOLLOW(Term)`, so we finally get `FOLLOW(Term) = { +, -, $, ) }`.

```
FOLLOW(Expr) = FOLLOW(Expr') = { $, ) }
FOLLOW(Term) = FOLLOW(Term') = { +, -, $, ) }
FOLLOW(Factor) = FIRST(Term) U FIRST(Expr') \ { Epsilon } U FOLLOW(Expr) = { +, -, *, /, ), $}
```
where `$` indicates end of string.
(Section 4.4.2 from [Aho et al.](https://www.pearson.com/us/higher-education/program/Aho-Compilers/PGM2809377.html))

Since expressions with more than one possible production, i.e. `Expr', Term', Factor`, have disjoint set of first symbols, we can use a lookahead symbol to determine a production (Section 4.4.2 from [Aho et al.](https://www.pearson.com/us/higher-education/program/Aho-Compilers/PGM2809377.html)).

We can now form predictive parsing table `M` as follows, for each production rule `X -> Y`
1. For each character `y` in `FIRST(Y)` add `X -> Y` to `M[X, y]`
2. If `Epsilon` is in `FIRST(Y)`, then for each `x` in `FOLLOW(X)` add `X -> Y` to `M[X, b]`

For example, to fill the row for `Expr'` we look for three of its possible productions:
- For `FIRST(+ Term Expr') = { + }`, so entry `M[Expr', +] = + Term Expr'`
- For `FIRST(- Term Expr') = { - }`, so entry `M[Expr', -] = - Term Expr'`
- For `FIRST(Epsilon) = { Epsilon }`, we need `FOLLOW(Expr') = { $, ) }` so entries `M[Expr', $] = M[Expr', )] = Epsilon`


| Rule \ Character | +                  | -             | *         | /         | [0-9]         | (             | )         | $       |
---                |---                 |---            |---        |---        |---            |---            |---        |---      |
| `Expr`           |                    |               |           |           | `Term Expr'`  | `Term Expr'`  |           |         |
| `Expr'`          | `+ Term Expr'`     | `- Term Expr'`|           |           |               |               | `Epsilon` | `Epsilon`|
| `Term`           |                    |               |           |           | `Factor Term'` | `Factor Term'` |           |          |
| `Term'`          | `Epsilon`          | `Epsilon`     | `* Factor Term'`| `/ Factor Term'`|   |               | `Epsilon` | `Epsilon`| 
| `Factor`         |                    |               |           |           | `Number`      | `( Expr )`    |

### Forming Syntax Tree

The predictive algorithm described below traverses grammar rules in preorder (Section 4.4.4 from Aho et al.).
![Predictive parsing algorithm](img/predictive-parsing.jpg)

In order to build the syntax tree, we need to keep an object next to a rule so that when a rule is expanded the objects points to its production terms.

Source: https://stackoverflow.com/a/27206881/1374078 

## Shunting-Yard algorithm

Another approach is to convert the infix notation to a postfix notation, e.g. `3+5-7` as postfix `3 5 + 7 -`. So, the operand can always be applied to its arguments to the left. The algorithm is taken from https://brilliant.org/wiki/shunting-yard-algorithm/ but some modifications need to take place. We can tokenize strings right away as we are parsing. Also, the line 5 should be changed from `greater precedence` to `greater or equal precedence` because in instances where operands have equal precedence the left association wins out `3*2/5`.