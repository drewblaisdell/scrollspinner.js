(function(){
	window.passage = {
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
		sensitivity: .05,
		sleepPeriod: 1000,
		threshold: 100,
	};

	function Spinner(){
		var that = this;

		this.createSpinner = function(){
			var canvas = document.createElement('canvas');
			canvas.id = 'passage';
			canvas.width = passage.width;
			canvas.height = passage.height;
			canvas.style.position = 'fixed';
			canvas.style.bottom = '5px';
			canvas.style.right = '5px';

			passage.context = canvas.getContext('2d');
			document.body.appendChild(canvas);
		};

		this.updateSpinner = function(percent){
			if(passage.sleepTimer){
				clearTimeout(passage.sleepTimer);
			}

			if(percent < 1 && percent > -1){
				passage.sleepTimer = setTimeout(function(){
					that.decaySpinner();
				}, passage.sleepPeriod);
			}
			
			drawArc(percent);
		};

		this.decaySpinner = function(){
			var currentTop = passage.sections[passage.index].offsetTop;			
			
			scrollTo(0, currentTop + passage.progress * passage.leadScroll);

			passage.complete = false;
			if(passage.progress === 0){
				return clearTimeout(passage.decayTimer);
			}

			if(passage.progress > 0){
				passage.progress = (passage.progress > passage.decaySpeed) ? passage.progress - passage.decaySpeed : 0;
			} else {
				passage.progress = (passage.progress < passage.decaySpeed) ? passage.progress + passage.decaySpeed : 0;
			}
			
			drawArc(passage.progress);

			passage.decayTimer = setTimeout(that.decaySpinner, 20);
		};

		this.completeSpinner = function(){
			var ctx = passage.context;

			ctx.beginPath();
			ctx.arc(passage.width / 2, passage.height / 2, passage.radius - passage.stroke / 2 - 2, 0, Math.PI * 2, false);
			ctx.fillStyle = (passage.progress > 0) ? passage.fillColor : passage.reverseFillColor;
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

			var ctx = passage.context;
			ctx.beginPath();
			ctx.arc(passage.width / 2, passage.height / 2, (passage.radius - passage.stroke / 2 - 2) * (extra / 30), 0, Math.PI * 2, false);
			ctx.fillStyle = (passage.progress > 0) ? passage.fillColor : passage.reverseFillColor;
			ctx.fill();

			setTimeout(function(){
				that.completeSpinnerTick(extra - 1);
			}, 20);
		};

		this.completeSpinnerEnd = function(){
			passage.complete = false;
			passage.progress = 0;
		};
	}

	var init = function(){
		passage.width = passage.radius * 2 + passage.stroke * 2;
		passage.height = passage.radius * 2 + passage.stroke * 2;
		passage.sections = document.getElementsByTagName('section');
		passage.spinner = new Spinner();
		passage.spinner.createSpinner();

		document.addEventListener('mousewheel', mouseWheelHandler);
	};

	var mouseWheelHandler = function(event){
		var event = window.event || event,
			delta = event.wheelDeltaY,
			increment = -delta / 100,
			currentTop = passage.sections[passage.index].offsetTop;

		if(passage.decayTimer){
			clearTimeout(passage.decayTimer);
		}

		passage.progress += increment * passage.sensitivity;
		if(passage.progress > 1){
			passage.progress = 1;
		} else if(passage.progress < -1){
			passage.progress = -1;
		}

		if((passage.progress === 1 || passage.progress === -1) && !passage.complete){
			passage.complete = true;
			passage.spinner.updateSpinner(passage.progress);
			passage.spinner.completeSpinner();

			if(passage.index + passage.progress < passage.sections.length && passage.index + passage.progress > -1){
				passage.index += passage.progress;
				goToSection(passage.index);
			}
		} else if (!passage.complete){
			passage.spinner.updateSpinner(passage.progress);

			// a little lead-scroll
			scrollTo(0, currentTop + passage.progress * passage.leadScroll);
		}

		event.preventDefault();
	};

	var goToSection = function(index){
		scrollToElement(passage.sections[index], 1000);
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
		var ctx = passage.context,
			reverse = (percent < 0) ? true : false;
		if(percent === 0){
			ctx.clearRect(0, 0, passage.width, passage.height);
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

		ctx.clearRect(0, 0, passage.width, passage.height);
		ctx.beginPath();
		ctx.arc(passage.width / 2, passage.height / 2, passage.radius, startAngle, endAngle, reverse);
		ctx.lineWidth = 10;
		if(reverse){
			ctx.strokeStyle = passage.reverseColor;
		} else {
			ctx.strokeStyle = passage.color;
		}
		ctx.stroke();
		ctx.closePath();
	};

	document.addEventListener('DOMContentLoaded', init);
}());