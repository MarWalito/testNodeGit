var chai = require('chai');
var sinon = require('sinon');
var nodeit = require('../nodeit');
var fs = require('fs');
const TARGET = nodeitDirname() + '/target';
fs.mkdirSync = function () {

};
fs.writeFileSync = function () {

};

describe('nodeit', function () {
    beforeEach(function () {
        chai.should();
        sinon.stub(fs, 'realpathSync').returns('vanilla.js');
    });

    describe('modularize', function () {
        it('should export the function from a vanilla js file ', function () {
            // Given
            sinon.stub(fs, 'readFileSync').returns('function desired_function_to_wrap(){}');

            // When
            var wrappedModule = nodeit.modularize('fileName');

            // Then
            wrappedModule.desired_function_to_wrap.should.be.defined;
        });
        it('should export all the functions from a vanilla js file ', function () {
            // Given
            var fileContent = '' +
                'function desired_function_to_wrap() {' +
                '   return  \'first wrap\';' +
                '}' +
                'function another_desired_function_to_wrap() {' +
                '   return \'second wrap\';' +
                '}';
            sinon.stub(fs, 'readFileSync').returns(fileContent);

            // When
            var wrappedModule = nodeit.modularize('fileName');

            // Then
            wrappedModule.desired_function_to_wrap().should.equal('first wrap');
            wrappedModule.another_desired_function_to_wrap().should.equal('second wrap');
        });

        afterEach(function () {
            fs.readFileSync.restore();
        });

    });
    describe('include', function () {
        it('should be defined', function () {
            nodeit.include.should.be.defined;
        });
        it('should add the dependency', function () {
            // Given
            sinon.stub(fs, 'readFileSync').returns('' +
                'function wrapped_function(){' +
                '   dep_name.inspect(0);' +
                '   return \'calling dependencies succeeded!\';' +
                '}');

            // When
            var wrappedModule = nodeit.include('dep_name', 'util').modularize('fileName');

            // Then
            wrappedModule.wrapped_function().should.equal('calling dependencies succeeded!');
            fs.readFileSync.restore();

        });
    });

    describe('compile', function () {

        var doesDirExist, createDirectory, createCompiledFile, readSourceFile;
        beforeEach(function () {
            doesDirExist = sinon.stub(fs, 'existsSync');
            createDirectory = sinon.spy(fs, 'mkdirSync');
            createCompiledFile = sinon.spy(fs, 'writeFileSync');
            readSourceFile = sinon.stub(fs, 'readFileSync');
            readSourceFile.returns('');
        });

        it('should be defined', function () {
            nodeit.compile.should.be.defined;
        });

        describe('dependsOnStatic', function () {
            it('should define given methods on the class given by its name', function () {
                // Given
                var wrappedModule = nodeit.modularize('fileName');

                //When
                wrappedModule.dependsOnStatic('Class', 'staticMethod');

                //Then
                Class.staticMethod.should.be.defined;

            });

            it('should append the class given by its name with staticMethods', function () {
                // Given
                var wrappedModule = nodeit.modularize('fileName');
                global.Class = {
                    existingStaticMethod: function () {

                    }
                };

                //When
                wrappedModule.dependsOnStatic('Class', 'anotherStaticMethod');

                //Then
                Class.existingStaticMethod.should.be.defined;
                Class.anotherStaticMethod.should.be.defined;

            });

            it('should append the class given by its name with staticMethods given by their names in an array', function () {
                // Given
                var wrappedModule = nodeit.modularize('fileName');

                //When
                wrappedModule.dependsOnStatic('Class', ['firstStaticMethod', 'secondStaticMethod']);

                //Then
                Class.firstStaticMethod.should.be.defined;
                Class.secondStaticMethod.should.be.defined;

            });

        });

        describe('dependsOn', function () {
            it('should define given methods on the class given by its name', function () {
                // Given
                var wrappedModule = nodeit.modularize('fileName');
                var classToInject = {
                    method: function () {

                    }
                };

                //When
                wrappedModule.dependsOn(classToInject, 'className');

                //Then
                className.method.should.be.defined;

            });

        });

        afterEach(function () {
            readSourceFile.restore();
            createDirectory.restore();
            doesDirExist.restore();
            createCompiledFile.restore();
        });
    });

    afterEach(function () {
        fs.realpathSync.restore();
    });
});

function nodeitDirname () {
    return __dirname.substring(0, __dirname.lastIndexOf('/'));
}
