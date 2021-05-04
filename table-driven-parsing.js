
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

function topOf(stack) {
    return stack[stack.length - 1];
}

function isDigit(character) {
    return '1234567890'.includes(character);
}

/*
    Compute FIRST and FOLLOW sets,
    Assume grammar is not left-recursive
    (Section 4.4.2 from Aho et al.)
*/
function addTo(A, B) {
    for(let elem of B) {
        A.add(elem);
    }
}
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
        stack = ['$', 'Expr'],
        expression = [];

    text += '$';

    while(topOf(stack) !== '$') {
        if(topOf(stack) === text[cursor]) {
            stack.pop();
            cursor += 1;
        } else {
            let production = [].concat(M[topOf(stack)][text[cursor]]);
            //console.log(production.join(' '));
            stack.pop();
            if(production[0] !== 'Epsilon') {
                stack.push(...production.reverse());
            }
        }
    }

    return expression;
}

function equals(A, B) {
    if(A.length != B.length) return false;

    for(let i=0; i<A.length; i++) {
        if(A[i] != B[i]) return false;
    }
    return true;
}
let M = PredictiveTable(grammar);
console.log(PredictiveParsing('7+3*5', M))