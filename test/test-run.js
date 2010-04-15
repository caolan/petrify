var run = require('run');


exports.testRequires = function(test){
    var fn = function(){return 'test';};
    test.same(
        run.requires(['task1','task2'], fn),
        {requires: ['task1','task2'], run: fn}
    );
    test.done();
};

exports.testAuto = function(test){
    var callOrder = [];
    var testdata = [{test: 'test'}];
    run.auto({
        task1: {
            requires: ['task2'],
            run: function(task){
                setTimeout(function(){
                    callOrder.push('task1');
                    task.done();
                }, 100);
            }
        },
        task2: function(task){
            setTimeout(function(){
                callOrder.push('task2');
                task.done();
            }, 200);
        },
        task3: {
            requires: ['task2'],
            run: function(task){
                callOrder.push('task3');
                task.done();
            }
        },
        task4: {
            requires: ['task1', 'task2'],
            run: function(task){
                callOrder.push('task4');
                task.done();
            }
        }
    },
    function(err){
        test.same(callOrder, ['task2','task3','task1','task4']);
        test.done();
    });
};
