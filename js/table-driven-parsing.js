
/*
    Define grammar as an object where key is a rule and its value is a list of productions
*/

grammar = {
    "Expr": [["Term", "Expr'"]],
    "Expr'": [
        ["+", "Term", "Expr'"],
        ["-", "Term", "Expr'"],
        ["Epsilon"]
    ],
    "Term": [["Factor", "Term'"]],
    "Term'": [
        ["*", "Factor", "Term'"],
        ["/", "Factor", "Term'"],
        ["Epsilon"]
    ],
    "Factor": [
        ["Number"],
        ["(", "Expr", ")"]
    ],
    "Number": [["0"],["1"],["2"],["3"],["4"],["5"],["6"],["7"],["8"],["9"],]
};

/*
    Utility
*/

function topOf(stack) {
    return stack[stack.length - 1];
}

function isDigit(character) {
    return character.length === 1 && '1234567890'.includes(character);
}

function addTo(A, B) {
    for(let elem of B) {
        A.add(elem);
    }
}

function equals(A, B) {
    if(A.length != B.length) return false;

    for(let i=0; i<A.length; i++) {
        if(A[i] != B[i]) return false;
    }
    return true;
}

function isEmptyObj(obj) {
    // source: https://stackoverflow.com/a/32108184/1374078
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}

/*
    Compute FIRST and FOLLOW sets,
    Assume grammar is not left-recursive
    (Section 4.4.2 from Aho et al.)
*/
function FIRST(rule, grammar) {
    // if rule is not in grammar, then it is a terminal
    if(!grammar[rule]) {
        return new Set([rule]);
    }

    let FIRST_SET = new Set([]);
    grammar[rule].forEach((productionRule) => {
        addTo(FIRST_SET, FIRST(productionRule[0], grammar));
    });
    return FIRST_SET;
}

function FOLLOW(rule, grammar) {
    if(!grammar[rule]) {
        return new Set([rule]);
    }

    let FOLLOW_SET = new Set([]);
    if(rule === 'Expr') FOLLOW_SET.add('$');

    Object.keys(grammar)
        .filter(reducedRule => reducedRule !== rule)
        .forEach((reducedRule) => {
            grammar[reducedRule].forEach((production) => {
                let idx = production.findIndex(p => p === rule);
                if(idx >= 0) {
                    if(idx < production.length - 1) {
                        addTo(FOLLOW_SET, FIRST(production[idx + 1], grammar));
                        FOLLOW_SET.delete("Epsilon");
                    }
                    if(idx == production.length - 1
                        || (idx < production.length - 1
                            && FIRST(production[idx + 1], grammar).has('Epsilon'))) {
                        addTo(FOLLOW_SET, FOLLOW(reducedRule, grammar));
                    }
                }
        });

    });

    return FOLLOW_SET;
}

/*
    Construct Predictive Table 
    (Algorithm 4.31 from Aho et al.)
*/
function PredictiveTable(grammar) {
    let M = {};
    Object.keys(grammar).forEach(Rule => {
        grammar[Rule].forEach(productionRule => {
            M[Rule] = M[Rule] || {};
            let FIRST_SET =  FIRST(productionRule[0], grammar);
            FIRST_SET.forEach(symbol => {
                M[Rule][symbol] = productionRule;
            });

            if(FIRST_SET.has('Epsilon')) {
                FOLLOW(Rule, grammar).forEach(symbol => {
                    M[Rule][symbol] = productionRule;
                });
            }
        });
    });
    return M;
}

/*
    Table-driven predictive parsing
    (Algorithm 4.34 from Aho et al.)
*/

function PredictiveParsing(text, M) {
    let cursor = 0,
        root = {'rule': 'Expr', 'production': []},
        // a node and its rule name are kept in alternating sequence inside stack
        // in order to construct a concrete syntax tree
        // source: https://stackoverflow.com/a/27206881/1374078
        stack = ['$', root, 'Expr'];

    text += '$';

    while(topOf(stack) !== '$') {
        if(topOf(stack) === text[cursor]) {
            let value = stack.pop();
            let node = stack.pop();
            cursor += 1;
            while(cursor < text.length && isDigit(node.rule) && isDigit(text[cursor])) {
                value += text[cursor];
                cursor += 1;
            }
            node.production.push(value);
        } else {
            let production = [].concat(M[topOf(stack)][text[cursor]]);
            let node_name = stack.pop();
            let node = stack.pop();

            production.forEach(term => {
                node.production.push({'rule': term, 'production': []});
            });

            if(production[0] !== 'Epsilon') {
                node.production.slice().reverse().forEach(node => {
                    stack.push(node);
                    stack.push(node.rule);
                });
            }
        }
    }

    return root;
}

/*
    Convert concrete to abstract syntax tree
*/
function toAST(concrete) {
    let rule = concrete.rule,
        production = concrete.production,
        term = production[0],
        expr1 = production[1];
    let Aterm = termToAST(term);
    let Aexpr1 = expr1ToAST(Aterm, expr1);
    return Aexpr1;
}

function numberToAST(number) {
    return number.production[0].production;
}

function factorToAST(factor) {
    const production = factor.production[0];
    if(production.rule === "(") {
        return toAST(factor.production[1]);
    } else {
        return numberToAST(production);
    }
}

function termToAST(term) {
    let factor = term.production[0],
        term1 = term.production[1];
    let Afactor = factorToAST(factor), 
        Aterm1 = term1ToAST(Afactor, term1);
    return Aterm1;
}

function term1ToAST(Afactor, term1) {
    if(term1.production[0].rule === "Epsilon") {
        return Afactor;
    }
    // Afactor comes from Term -> Afactor term1
    // term1 -> operator factor term2
    // => (Afactor operator factor, term2) 
    let operator = term1.production[0].rule;
        factor = term1.production[1],
        Bfactor = factorToAST(factor),
        term2 = term1.production[2];
    
    return term1ToAST([Afactor, operator, Bfactor], term2);
}

function expr1ToAST(Aterm, expr1) {
    if(expr1.production[0].rule === "Epsilon") {
        return Aterm;
    }

    let operator = expr1.production[0].rule,
        term = termToAST(expr1.production[1]),
        expr2 = expr1.production[2];

    return expr1ToAST([Aterm, operator, term], expr2);
}

/*
    Evalute abstract syntax tree
*/

function evalAST(abstract) {
    if(abstract.length == 1) {
        return parseInt(abstract[0]);
    } else {
        return applyOperator(abstract[1])(evalAST(abstract[0]), evalAST(abstract[2]));
    }
}
function applyOperator(operator) {
    switch(operator) {
        case '+': return (a, b) => a + b;
        case '-': return (a, b) => a - b;
        case '*': return (a, b) => a * b;
        case '/': return (a, b) => a / b;
        default:
            console.error('Unexpected operator ' + operator);
    }
}

// Compare results
let M = PredictiveTable(grammar);
function evalTableDriven(text) {
    let p = PredictiveParsing(text, M);
        q = toAST(p);
    return evalAST(q);
}
function testEvalAST() {
    console.log(evalTableDriven(('1-3+54-5+3*(10)')) === 1-3+54-5+3*(10));
    console.log(evalTableDriven(('(3-2)+5')) === (3-2)+5);
    console.log(evalTableDriven(('3-(2+5)')) === 3-(2+5));
    console.log(evalTableDriven(('6*(234-6)')) === 6*(234-6));
    console.log(evalTableDriven(('34-5*2+6*(234-6)')) === 34-5*2+6*(234-6));
    console.log(evalTableDriven(('(3+5)*7-5')) === (3+5)*7-5);
    console.log(evalTableDriven(('34+5*2+5')) === 34+5*2+5);
    console.log(evalTableDriven(('8+4*2*3+5*1*0')) === 8+4*2*3+5*1*0);
    console.log(evalTableDriven(('1+3-4')) === 1+3-4);
    console.log(evalTableDriven(('2*11+3*33')) === 2*11+3*33);
    console.log(evalTableDriven(('2*3*22+5*10+7+6+66+666')) === 2*3*22+5*10+7+6+66+666);
}

testEvalAST();