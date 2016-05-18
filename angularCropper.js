
//Deprecated and no longer in use! It was a good try!
(function() {
    angular.module('app.partials')
        .directive('imageUploader', ['fileReader', imageUploaderDirective])
        .directive('uploadCanvas', uploadCanvasDirective);

    function imageUploaderDirective(fileReader) {
        return {
            restrict: 'A',
            templateUrl: 'views/partials/imageUploader.html',
            scope: {
                imageSrc: "=imageUploader",
                initSrc: "@initSrc",
                api: "=api"
            },
            controller: controller,
            link: link
        }



        function link($scope, $elem, $attrs) {
            var width = $attrs.width;
            var height = $attrs.height;

            $elem.children().first().css('width', width).css('height', height);

            $scope.file = null;

            $scope.getCanvas = function() {
                return angular.element('canvas', $elem)[0];
            };

            $scope.triggerUpload = function() {
                angular.element(".upload:hidden", $elem).trigger('click');
            };

            $scope.getFile = function () {
                fileReader.readAsDataUrl($scope.file, $scope)
                    .then(function(result) {
                        $scope.imageSrc = result;
                    });
            };
        }
    }


    function uploadCanvasDirective() {
        return {
            scope: {
                src: "=uploadCanvas",
            },
            link: link
        }

        function link($scope, $elem) {
            var container = $elem.parent();
            var canvas = $elem[0];
            var SCALE = 1;
            var MIN_SCALE = 0;
            var MAX_SCALE = 1;
            var mouseDown = false;
            var panX = 0, panY = 0;
            var prevX = 0, prevY = 0;
            var ctx, img;
            canvas.width = container.width();
            canvas.height = container.height();

            ctx = canvas.getContext("2d");

            $scope.$watch('src', function() {
                initCanvas();
            });

            function initCanvas() {
                mouseDown = false;
                panX = 0;
                panY = 0;
                prevX = 0;
                prevY = 0;

                //reset context transforms and clear any old data
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

                img = angular.element('<img />')
                    .bind('load', function() {
                        scaleToFit(this);
                        setTransform(0, 0);
                        redraw();
                    })
                    .prop('src', $scope.src)[0];
            }



            //Bind all canvas events to move/scale image

            $elem.bind('mousedown', function(event) {
                mouseDown = true;
                prevX = event.pageX;
                prevY = event.pageY;
            });
            angular.element(document.body).bind('mouseup', function(event) {
                mouseDown = false;
            });
            angular.element(document.body).bind('mousemove', function(event) {
                if (mouseDown) {
                    event.preventDefault();

                    var newX = event.pageX;
                    var newY = event.pageY;

                    var deltaX = newX - prevX;
                    var deltaY = newY - prevY;

                    //console.log(Math.abs(panX + deltaX) + ' ' + img.width*SCALE);
                    if (panX + deltaX < 0 && Math.abs(panX + deltaX) < (img.width*SCALE - canvas.width)) {
                        panX += deltaX;
                        prevX = newX;
                    }

                    if (panY + deltaY < 0 && Math.abs(panY + deltaY) < (img.height*SCALE - canvas.height)) {
                        panY += deltaY;
                        prevY = newY;
                    }

                    checkPan();

                    setTransform();
                    redraw();
                }


            });

            $elem.bind('wheel', function(event) {
                event.preventDefault();
                var delta = event.originalEvent.wheelDelta;
                delta = (delta/Math.abs(delta) * 0.1);

                var prevScale = SCALE;
                if (SCALE + delta <= MIN_SCALE) {
                    SCALE = MIN_SCALE;
                } else if (SCALE + delta >= MAX_SCALE) {
                    SCALE = MAX_SCALE;
                } else {
                    SCALE = SCALE + delta;
                }

                panX = panX - ((img.width/2 * SCALE) - (img.width/2 * prevScale));
                panY = panY - ((img.height/2 * SCALE) - (img.height/2 * prevScale));

                checkPan();

                setTransform();
                redraw();
            });

            function checkPan() {

                //Check if pan is attempting to show outer boundaries of image
                if (panX > 0) {
                    panX = 0;
                } else if (Math.abs(panX) > (img.width * SCALE - canvas.width)) {
                    panX = canvas.width - img.width * SCALE;
                }

                if (panY > 0) {
                    panY = 0;
                } else if (Math.abs(panY) > (img.height * SCALE - canvas.height)) {
                    panY = canvas.height - img.height * SCALE;
                }

            }

            function setTransform() {

                var x = Math.round(panX);
                var y = Math.round(panY);


                ctx.setTransform(SCALE, 0, 0, SCALE, x, y);

            };

            function redraw() {

                ctx.save();
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

                ctx.restore();

                ctx.drawImage(img, 0, 0);

            }

            function scaleToFit(img) {

                var wScale = canvas.width/img.width;
                var hScale = canvas.height/img.height;

                SCALE = wScale > hScale ? wScale : hScale;
                MIN_SCALE = SCALE;
            }

        }

    }
}())