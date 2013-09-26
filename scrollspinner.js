var scrollSpinner = function(config){
	// object declarations to avoid hoisting confusion
	var root = this,
		sections = [],
		sectionList,
		settings,
		spinEngine,
		spinnerSize = {};

	var default_settings = {
		color: 'rgba(100,100,100,0.5)',
		reverseColor: 'rgba(100,100,100,0.5)',
		complete: false,
		decaySpeed: 0.02,
		fillColor: 'rgba(0, 200, 0, 0.5)',
		reverseFillColor: 'rgba(255, 161, 0, 0.5)',
		index: 0,
		leadScroll: 30,
		progress: 0,
		radius: 20,
		sectionNames: [],
		scrollTime: 1000,
		stroke: 12,
		mouseSensitivity: .05,
		sleepPeriod: 1000,
		touchSensitivity: 2
	};

	function Spinner(){
		var that = this;

		this.createSpinner = function(){
			var canvas = document.createElement('canvas');
			canvas.id = 'scrollspinner';
			canvas.width = spinnerSize.width;
			canvas.height = spinnerSize.height;
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
				}, settings.sleepPeriod);
			}
			
			drawArc(percent);
		};

		this.decaySpinner = function(){
			var currentTop = sections[settings.index].offsetTop;			
			
			scrollTo(0, currentTop + settings.progress * settings.leadScroll);

			settings.complete = false;
			if(settings.progress === 0){
				return clearTimeout(root.decayTimer);
			}

			if(settings.progress > 0){
				settings.progress = (settings.progress > settings.decaySpeed) ? settings.progress - settings.decaySpeed : 0;
			} else {
				settings.progress = (settings.progress < settings.decaySpeed) ? settings.progress + settings.decaySpeed : 0;
			}
			
			drawArc(settings.progress);

			root.decayTimer = setTimeout(that.decaySpinner, 20);
		};

		this.completeSpinner = function(){
			var ctx = root.context;

			ctx.beginPath();
			ctx.arc(spinnerSize.width / 2, spinnerSize.height / 2, settings.radius - settings.stroke / 2 - 2, 0, Math.PI * 2, false);
			ctx.fillStyle = (settings.progress > 0) ? settings.fillColor : settings.reverseFillColor;
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
			ctx.arc(spinnerSize.width / 2, spinnerSize.height / 2, (settings.radius - settings.stroke / 2 - 2) * (extra / 30), 0, Math.PI * 2, false);
			ctx.fillStyle = (settings.progress > 0) ? settings.fillColor : settings.reverseFillColor;
			ctx.fill();

			setTimeout(function(){
				that.completeSpinnerTick(extra - 1);
			}, 20);
		};

		this.completeSpinnerEnd = function(){
			settings.complete = false;
			settings.progress = 0;
		};
	}

	var createSectionList = function(){
		var name, item,
			sectionNames = settings.sectionNames;
		if(sectionNames.length > 0){
			sectionList = document.createElement('ul');
			sectionList.id = 'scrollspinner-names';

			for(var i = 0, l = sectionNames.length; i < l; i++){
				item = document.createElement('li');
				if(i === 0){
					item.className = 'current-section';
				}

				item.innerHTML = sectionNames[i];
				sectionList.appendChild(item);
			}

			document.body.appendChild(sectionList);
		}
	};

	var changeCurrentSection = function(sectionIndex, reverse){
		var sectionList = document.getElementById('scrollspinner-names'),
			current = sectionList.getElementsByClassName('current-section'),
			next = sectionList.children[sectionIndex];

		current[0].className = 'last-section';
		next.className = 'current-section';

		setTimeout(function(){
			sectionList.getElementsByClassName('last-section')[0].className = '';
		}, 1000);
	};

	var movementHandler = function(delta){
		var increment = -delta,
			currentTop = sections[settings.index].offsetTop;

		if(root.decayTimer){
			clearTimeout(root.decayTimer);
		}

		settings.progress += increment;

		if((settings.progress < 0 && settings.index === 0) ||
			(settings.progress > 0 && settings.index === sections.length - 1)){
			settings.progress = 0;
		}

		if(settings.progress > 1){
			settings.progress = 1;
		} else if(settings.progress < -1){
			settings.progress = -1;
		}

		if((settings.progress === 1 || settings.progress === -1) && !settings.complete){
			settings.complete = true;
			spinEngine.updateSpinner(settings.progress);
			spinEngine.completeSpinner();

			if(settings.index + settings.progress < sections.length && settings.index + settings.progress > -1){
				settings.index += settings.progress;
				goToSection(settings.index);
				changeCurrentSection(settings.index);
			}
		} else if (!settings.complete){
			spinEngine.updateSpinner(settings.progress);

			// a little lead-scroll
			scrollTo(0, currentTop + settings.progress * settings.leadScroll);
		}
	};

	var mouseWheelHandler = function(event){
		var event = window.event || event,
			delta = event.wheelDeltaY || -event.detail,
			progressDelta = delta / 100 * settings.mouseSensitivity;

		if(!settings.firstDelta){
			settings.firstDelta = delta;
			if(Math.abs(delta) > 25 || !event.wheelDeltaY){
				settings.mouseSensitivity = 0.5;
			}

			if(!event.wheelDeltaY){
				settings.scrollTime = 500;
			}
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

		delta /= 100 * settings.touchSensitivity;

		movementHandler(delta);

		event.preventDefault();
	};

	var goToSection = function(index){
		scrollToElement(sections[index], settings.scrollTime);
	};

	var scrollToElement = function(element, duration) {
		var initial = window.scrollY,
			amount = element.offsetTop - window.scrollY;

		scrollTick(0, initial, amount);
    };

    var scrollTick = function(t, initial, amount){
    	if(t === settings.scrollTime){
    		return;
    	}

    	var x = t / settings.scrollTime;
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
			ctx.clearRect(0, 0, spinnerSize.width, spinnerSize.height);
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

		ctx.clearRect(0, 0, spinnerSize.width, spinnerSize.height);
		ctx.beginPath();
		ctx.arc(spinnerSize.width / 2, spinnerSize.height / 2, settings.radius, startAngle, endAngle, reverse);
		ctx.lineWidth = 10;
		if(reverse){
			ctx.strokeStyle = settings.reverseColor;
		} else {
			ctx.strokeStyle = settings.color;
		}
		ctx.stroke();
		ctx.closePath();
	};

	var init = function(config){
		settings = config || {};

		for(var i in default_settings){
			if(!settings[i]){
				settings[i] = default_settings[i];
			}
		}

		spinnerSize.width = settings.radius * 2 + settings.stroke * 2;
		spinnerSize.height = settings.radius * 2 + settings.stroke * 2;
		sections = document.getElementsByTagName('section');
		spinEngine = new Spinner();
		spinEngine.createSpinner();

		createSectionList();

		var i, l = sections.length;
		for(i = 0; i < l; i++){
			sections[i].style.height = window.innerHeight +'px';
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

	init(config);
};

document.addEventListener('DOMContentLoaded', function(){
	scrollSpinner({
		color: 'rgba(0, 0, 0, 1)',
		reverseColor: 'rgba(0, 0, 0, 1)',
		sectionNames: [ "scrollspinner.js", "Lorem Ipsum", "not much", "hey"]
	});
});