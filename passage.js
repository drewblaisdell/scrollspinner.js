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
			var currentTop = root.sections[config.index].offsetTop;			
			
			scrollTo(0, currentTop + config.progress * config.leadScroll);

			config.complete = false;
			if(config.progress === 0){
				return clearTimeout(root.decayTimer);
			}

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

	var init = function(){
		root.width = config.radius * 2 + config.stroke * 2;
		root.height = config.radius * 2 + config.stroke * 2;
		root.sections = document.getElementsByTagName('section');
		root.spinner = new Spinner();
		root.spinner.createSpinner();

		document.addEventListener('mousewheel', mouseWheelHandler);
		document.addEventListener('touchstart', touchStartHandler);
		document.addEventListener('touchmove', touchMoveHandler);
	};

	var movementHandler = function(delta){
		var increment = -delta,
			currentTop = root.sections[config.index].offsetTop;

		if(root.decayTimer){
			clearTimeout(root.decayTimer);
		}

		config.progress += increment;

		if((config.progress < 0 && config.index === 0) ||
			(config.progress > 0 && config.index === root.sections.length - 1)){
			config.progress = 0;
		}

		if(config.progress > 1){
			config.progress = 1;
		} else if(config.progress < -1){
			config.progress = -1;
		}

		if((config.progress === 1 || config.progress === -1) && !config.complete){
			config.complete = true;
			root.spinner.updateSpinner(config.progress);
			root.spinner.completeSpinner();

			if(config.index + config.progress < root.sections.length && config.index + config.progress > -1){
				config.index += config.progress;
				goToSection(config.index);
			}
		} else if (!config.complete){
			root.spinner.updateSpinner(config.progress);

			// a little lead-scroll
			scrollTo(0, currentTop + config.progress * config.leadScroll);
		}
	};

	var mouseWheelHandler = function(event){
		var event = window.event || event,
			delta = event.wheelDeltaY / 100 * config.mouseSensitivity;

		movementHandler(delta);

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
		scrollToElement(root.sections[index], 1000);
	};

	var scrollToElement = function(element, duration) {
		var initial = window.scrollY,
			amount = element.offsetTop - window.scrollY;

		scrollTick(0, initial, amount);
    };

    var scrollTick = function(t, initial, amount){
    	if(t === 1000){
    		return;
    	}

    	var x = t / 1000;
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

	document.addEventListener('DOMContentLoaded', init);
}());