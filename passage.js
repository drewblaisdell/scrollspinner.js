(function(){
	var root = this;

	var config = {
		color: 'rgba(100,100,100,0.5)',
		reverseColor: 'rgba(100,100,100,0.5)',
		complete: false,
		decaySpeed: 0.02,
		fillColor: 'rgba(0, 200, 0, 0.5)',
		reverseFillColor: 'rgba(255, 161, 0, 0.5)',
		index: 0,
		leadScroll: 30,
		progress: 0,
		radius: 30,
		scrollTime: 1500,
		stroke: 10,
		mouseSensitivity: .05,
		sleepPeriod: 1000,
		threshold: 100,
		touchSensitivity: 2
	};

	function Spinner(){
		var that = this;

		this.createSpinner = function(){
			var canvas = document.createElement('canvas');
			canvas.id = 'passage';
			canvas.width = root.width;
			canvas.height = root.height;
			canvas.style.position = 'fixed';
			canvas.style.bottom = '5px';
			canvas.style.right = '5px';

			root.context = canvas.getContext('2d');
			document.body.appendChild(canvas);
		};

		this.updateSpinner = function(percent){
			if(root.sleepTimer){
				clearTimeout(root.sleepTimer);
			}

			if(percent < 1 && percent > -1){
				root.sleepTimer = setTimeout(function(){
					that.decaySpinner();
				}, config.sleepPeriod);
			}
			
			drawArc(percent);
		};

		this.decaySpinner = function(){
			if(config.progress === 0){
				return clearTimeout(root.decayTimer);
			}

			var scrollStart;
			if(config.progress > 0){
				scrollStart = root.offsets[config.index].bottom - window.innerHeight;
			} else {
				scrollStart = root.offsets[config.index].top;
			}

			scrollTo(0, scrollStart + config.progress * config.leadScroll);

			config.complete = false;

			if(config.progress > 0){
				config.progress = (config.progress > config.decaySpeed) ? config.progress - config.decaySpeed : 0;
			} else {
				config.progress = (config.progress < config.decaySpeed) ? config.progress + config.decaySpeed : 0;
			}
			
			drawArc(config.progress);

			root.decayTimer = setTimeout(that.decaySpinner, 20);
		};

		this.completeSpinner = function(){
			var ctx = root.context;

			ctx.beginPath();
			ctx.arc(root.width / 2, root.height / 2, config.radius - config.stroke / 2 - 2, 0, Math.PI * 2, false);
			ctx.fillStyle = (config.progress > 0) ? config.fillColor : config.reverseFillColor;
			ctx.fill();

			setTimeout(function(){
				that.completeSpinnerTick(30);
			}, 500);
			
		};

		this.completeSpinnerTick = function(extra){
			if(extra < 0){
				return this.completeSpinnerEnd();
			}
			
			drawArc(extra / 30);

			var ctx = root.context;
			ctx.beginPath();
			ctx.arc(root.width / 2, root.height / 2, (config.radius - config.stroke / 2 - 2) * (extra / 30), 0, Math.PI * 2, false);
			ctx.fillStyle = (config.progress > 0) ? config.fillColor : config.reverseFillColor;
			ctx.fill();

			setTimeout(function(){
				that.completeSpinnerTick(extra - 1);
			}, 20);
		};

		this.completeSpinnerEnd = function(){
			config.complete = false;
			config.progress = 0;
		};
	}

	var movementHandler = function(delta){
		if(delta < 0){
			delta = Math.max(-0.2, delta);
		}

		var increment = -delta,
			currentTop = root.sections[config.index].offsetTop,
			rect = root.sections[config.index].getBoundingClientRect();

		if(root.decayTimer){
			clearTimeout(root.decayTimer);
		}

		if((config.progress > 0 && config.progress + increment < 0) ||
		(config.progress < 0 && config.progress + increment > 0)){
			config.progress = 0;
		} else {
			config.progress += increment;
		}

		// if((config.progress < 0 && config.index === 0) ||
		// 	(config.progress > 0 && config.index === root.sections.length - 1)){
		// 	config.progress = 0;
		// }

		if(config.progress > 1){
			config.progress = 1;
		} else if(config.progress < -1){
			config.progress = -1;
		}

		if((config.progress === 1 || config.progress === -1) && !config.complete){
			// complete
			config.complete = true;
			root.spinner.updateSpinner(config.progress);
			root.spinner.completeSpinner();

			if(config.index + config.progress < root.sections.length && config.index + config.progress > -1){
				config.index += config.progress;
				goToSection(config.index);
			}
		} else if (!config.complete){
			// incomplete
			root.spinner.updateSpinner(config.progress);

			var scrollStart;
			if(config.progress > 0){
				scrollStart = root.offsets[config.index].bottom - window.innerHeight;
			} else {
				scrollStart = root.offsets[config.index].top;
			}

			// a little lead-scroll
			scrollTo(0, scrollStart + config.progress * config.leadScroll);
		}
	};

	var mouseWheelHandler = function(event){
		var event = window.event || event,
			delta = event.wheelDeltaY || -event.detail,
			progressDelta = delta / 100 * config.mouseSensitivity,
			offsets = root.offsets[config.index],
			scrollStartTop = offsets.top,
			scrollStartBottom = offsets.bottom,
			scrollTop = document.body.scrollTop,
			windowHeight = window.innerHeight;

		if(!config.firstDelta){
			config.firstDelta = delta;

			if(Math.abs(delta) > 25 || !event.wheelDeltaY){
				config.mouseSensitivity = 0.5;
			}

			if(!event.wheelDeltaY){
				config.scrollTime = 500;
			}
		}

		if(root.decayTimer){
			clearTimeout(root.decayTimer)
		}

		var newScrollBottom = scrollTop + windowHeight - delta,
			newScrollTop = scrollTop - delta;

		if(scrollTop + windowHeight - delta > scrollStartBottom){
	//		document.body.scrollTop = scrollStartBottom;
		} else if(newScrollBottom < scrollStartBottom && config.progress === 0 && delta < 0){
			return true;
		} else if(scrollTop > scrollStartTop && config.progress <= 0){
			return true;
		}

		movementHandler(progressDelta);

		event.preventDefault();
	};

	var touchStartHandler = function(event){
		var touch = event.touches[0],
			x = touch.pageX,
			y = touch.pageY;
	
		root.lastY = y;
	};

	var touchMoveHandler = function(event){
		var touch = event.touches[0],
			x = touch.pageX,
			y = touch.pageY,
			delta = (root.lastY - y);

		root.lastY = y;

		delta /= 100 * config.touchSensitivity;

		movementHandler(delta);

		event.preventDefault();
	};

	var goToSection = function(index){
		scrollToElement(root.sections[index], config.scrollTime);
	};

	var scrollToElement = function(element, duration) {
		var initial = window.scrollY,
			amount = element.offsetTop - window.scrollY;

		scrollTick(0, initial, amount);
    };

    var scrollTick = function(t, initial, amount){
    	if(t === config.scrollTime){
    		return;
    	}

    	var x = t / config.scrollTime;
    	x = x<.5 ? 2*x*x : -1+(4-2*x)*x; // easing with quad in-out

    	var position = Math.ceil(initial + x * amount);
		scrollTo(0, position);

		setTimeout(function(){
			scrollTick(t + 10, initial, amount);
		});
	};

	var drawArc = function(percent){
		var ctx = root.context,
			reverse = (percent < 0) ? true : false;
		if(percent === 0){
			ctx.clearRect(0, 0, root.width, root.height);
			return false;
		} else if(percent === 1 || percent === -1){
			startAngle = 0;
			endAngle = Math.PI * 2;
		} else {
			if(reverse){
				startAngle = Math.PI * 1.5;
				endAngle = Math.PI * 1.5 + Math.PI * 2 * percent;
			} else {
				startAngle = Math.PI * 1.5;
				endAngle = Math.PI * 2 * percent - Math.PI * .5;
			}
		}

		ctx.clearRect(0, 0, root.width, root.height);
		ctx.beginPath();
		ctx.arc(root.width / 2, root.height / 2, config.radius, startAngle, endAngle, reverse);
		ctx.lineWidth = 10;
		if(reverse){
			ctx.strokeStyle = config.reverseColor;
		} else {
			ctx.strokeStyle = config.color;
		}
		ctx.stroke();
		ctx.closePath();
	};

	var init = function(){
		scrollTo(0, 0);
		root.width = config.radius * 2 + config.stroke * 2;
		root.height = config.radius * 2 + config.stroke * 2;
		root.sections = document.getElementsByTagName('section');
		root.spinner = new Spinner();
		root.spinner.createSpinner();
		root.offsets = [];

		var i, l = root.sections.length;
		for(i = 0; i < l; i++){
			var rect = root.sections[i].getBoundingClientRect();
			root.offsets.push({ top: rect.top, bottom: rect.bottom });
		}

		if(document.attachEvent){
			document.attachEvent('onmousewheel', mouseWheelHandler);
		} else if(document.addEventListener){
			document.addEventListener('mousewheel', mouseWheelHandler);
			document.addEventListener('DOMMouseScroll', mouseWheelHandler);
			document.addEventListener('touchstart', touchStartHandler);
			document.addEventListener('touchmove', touchMoveHandler);

		}
	};

	document.addEventListener('DOMContentLoaded', init);
}());