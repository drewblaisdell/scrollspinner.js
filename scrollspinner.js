var scrollspinner = function(config){
	// object declarations to avoid hoisting confusion
	var complete = false,
		currentSection,
		index = 0,
		progress = 0,
		root = this,
		sectionOffsets = [],
		sectionList,
		settings,
		spinnerElement,
		spinEngine,
		spinnerSize = {};

	var default_settings = {
		color: 'rgba(0,0,0,1)',
		reverseColor: 'rgba(0,0,0,1)',
		decaySpeed: 0.02,
		fillColor: 'rgba(0, 200, 0, 0.5)',
		reverseFillColor: 'rgba(255, 161, 0, 0.5)',
		rubberband: 30,
		radius: 20,
		sections: [],
		scrollDelay: 0,
		scrollTime: 1000,
		stroke: 12,
		mouseSensitivity: .05,
		sleepPeriod: 1000,
		touchSensitivity: 2
	};

	var addListener = function(element, event, handler){
		if(element.addEventListener){
			element.addEventListener(event, handler, false);
		} else if(element.attachEvent){
			element.attachEvent('on'+ event, false);
		} else {
			element['on'+ event] = handler;
		}
	};

	function Spinner(){
		var that = this;

		this.createSpinner = function(){
			var canvas = document.createElement('canvas');
			canvas.width = spinnerSize.width;
			canvas.height = spinnerSize.height;

			root.context = canvas.getContext('2d');
			spinnerElement.appendChild(canvas);

			that.drawBackground();
		};

		this.drawBackground = function(){
			var ctx = root.context;
		
			ctx.beginPath();
			ctx.arc(spinnerSize.width / 2, spinnerSize.height / 2, settings.radius, 0, 2 * Math.PI, false);
			ctx.lineWidth = 10;
			ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
			ctx.stroke();
			ctx.closePath();
		}

		this.updateSpinner = function(percent){
			if(root.sleepTimer){
				clearTimeout(root.sleepTimer);
			}

			if(percent < 1 && percent > -1){
				root.sleepTimer = setTimeout(function(){
					that.decaySpinner();
				}, settings.sleepPeriod);
			}
			
			that.drawarc(percent);
		};

		this.decaySpinner = function(){
			var currentTop = sectionOffsets[index].offsetTop
				rubberband = (currentSection && currentSection.rubberband >= 0) ? currentSection.rubberband : settings.rubberband;

			scrollTo(0, currentTop + progress * rubberband);

			complete = false;
			if(progress === 0){
				return clearTimeout(root.decayTimer);
			}

			if(progress > 0){
				progress = (progress > settings.decaySpeed) ? progress - settings.decaySpeed : 0;
			} else {
				progress = (progress < settings.decaySpeed) ? progress + settings.decaySpeed : 0;
			}
			
			that.drawarc(progress);

			// onSpin callback
			if(typeof settings.sections[index].onSpin === 'function'){
				settings.sections[index].onSpin(progress);
			}

			root.decayTimer = setTimeout(that.decaySpinner, 20);
		};

		this.drawarc = function(percent){
			var ctx = root.context,
				reverse = (percent < 0) ? true : false;
			if(percent === 0){
				ctx.clearRect(0, 0, spinnerSize.width, spinnerSize.height);
				that.drawBackground();
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
			that.drawBackground();
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

		this.completeSpinner = function(){
			var ctx = root.context,
				scrollDelay = (currentSection.scrollDelay && currentSection.scrollDelay >= 0) ? currentSection.scrollDelay : settings.scrollDelay;

			scrollDelay = (scrollDelay > 500) ? scrollDelay : 500;

			ctx.beginPath();
			ctx.arc(spinnerSize.width / 2, spinnerSize.height / 2, settings.radius - settings.stroke / 2 - 2, 0, Math.PI * 2, false);
			ctx.fillStyle = (progress > 0) ? settings.fillColor : settings.reverseFillColor;
			ctx.fill();

			setTimeout(function(){
				that.completeSpinnerTick(30);
			}, scrollDelay);
			
		};

		this.completeSpinnerTick = function(extra){
			if(extra < 0){
				return this.completeSpinnerEnd();
			}
			
			that.drawarc(extra / 30);

			var ctx = root.context;
			ctx.beginPath();
			ctx.arc(spinnerSize.width / 2, spinnerSize.height / 2, (settings.radius - settings.stroke / 2 - 2) * (extra / 30), 0, Math.PI * 2, false);
			ctx.fillStyle = (progress > 0) ? settings.fillColor : settings.reverseFillColor;
			ctx.fill();

			setTimeout(function(){
				that.completeSpinnerTick(extra - 1);
			}, 20);
		};

		this.completeSpinnerEnd = function(){
			complete = false;
			progress = 0;
		};
	}

	var keyPressHandler = function(event){
		var keyCode = event.keyCode;
		if(keyCode === 40 || keyCode === 39){
			// down or right arrow keypress
			progress = 1;
			movementHandler(0);
			event.preventDefault();
		} else if (keyCode === 38 || keyCode === 37){
			// up or left arrow keypress
			progress = -1;
			movementHandler(0);
			event.preventDefault();
		}
	};

	var createSectionList = function(){
		var name, item,
			sections = settings.sections;
		if(sections.length > 0){
			sectionList = document.createElement('ul');

			for(var i = 0, l = sections.length; i < l; i++){
				item = document.createElement('li');
				if(i === 0){
					item.className = 'current-section';
				}

				item.innerHTML = sections[i].name;
				sectionList.appendChild(item);
			}

			spinnerElement.appendChild(sectionList);
		}
	};

	var changeCurrentSection = function(sectionIndex, reverse){
		if(settings.sections.length > 0){
			var sectionList = spinnerElement.getElementsByTagName('ul')[0],
				current = sectionList.getElementsByClassName('current-section'),
				next = sectionList.children[sectionIndex];

			currentSection = settings.sections[sectionIndex];

			sectionList.className = 'visible';
			sectionList.style.marginTop = -(sectionIndex * 20) + 21 +'px';

			current[0].className = '';
			next.className = 'current-section';

			setTimeout(function(){
				sectionList.className = '';
			}, 1000);
		}
	};

	var sectionListMouseOverHandler = function(){
		sectionList.className = 'visible';
	};

	var sectionListMouseOutHandler = function(){
		sectionList.className = '';
	};

	var movementHandler = function(delta){
		var increment = -delta,
			currentTop = sectionOffsets[index].offsetTop;

		if(root.decayTimer){
			clearTimeout(root.decayTimer);
		}

		progress += increment;

		if((progress < 0 && index === 0) ||
			(progress > 0 && index === sectionOffsets.length - 1)){
			progress = 0;
		}

		if(progress > 1){
			progress = 1;
		} else if(progress < -1){
			progress = -1;
		}

		if((progress === 1 || progress === -1) && !complete){
			complete = true;
			spinEngine.updateSpinner(progress);
			spinEngine.completeSpinner();

			if(index + progress < sectionOffsets.length && index + progress > -1){
				var scrollDelay = (currentSection.scrollDelay && currentSection.scrollDelay >= 0) ? currentSection.scrollDelay : settings.scrollDelay;

				index += progress;
				
				setTimeout(function(){
					goToSection(index);
				}, scrollDelay);

				changeCurrentSection(index);
			}
		} else if (!complete){
			var rubberband = (currentSection && currentSection.rubberband >= 0) ? currentSection.rubberband : settings.rubberband;

			spinEngine.updateSpinner(progress);

			// a little lead-scroll
			scrollTo(0, currentTop + progress * rubberband);

			// onSpin for each section
			if(typeof settings.sections[index].onSpin === 'function'){
				settings.sections[index].onSpin(progress);
			}
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
		scrollToElement(sectionOffsets[index], settings.scrollTime);
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

	var init = function(config){
		settings = config || {};

		for(var i in default_settings){
			if(!settings[i]){
				settings[i] = default_settings[i];
			}
		}

		// add scrollspinner container to the DOM
		spinnerElement = document.createElement('div');
		spinnerElement.id = 'scrollspinner';
		document.body.appendChild(spinnerElement);

		createSectionList();

		spinnerSize.width = settings.radius * 2 + settings.stroke * 2;
		spinnerSize.height = settings.radius * 2 + settings.stroke * 2;
		sectionOffsets = document.getElementsByTagName('section');
		spinEngine = new Spinner();
		spinEngine.createSpinner();

		currentSection = settings.sections[0];

		var i, l = sectionOffsets.length;
		for(i = 0; i < l; i++){
			sectionOffsets[i].style.height = window.innerHeight +'px';
		}

		addListener(sectionList, 'mouseover', sectionListMouseOverHandler);
		addListener(sectionList, 'mouseout', sectionListMouseOutHandler);
		addListener(document, 'keydown', keyPressHandler);
		addListener(document, 'mousewheel', mouseWheelHandler);
		addListener(document, 'DOMMouseScroll', mouseWheelHandler);
		addListener(document, 'touchstart', touchStartHandler);
		addListener(document, 'touchmove', touchMoveHandler);
	};

	init(config);
};

document.addEventListener('DOMContentLoaded', function(){
	scrollspinner({
		color: 'rgba(0, 0, 0, 1)',
		reverseColor: 'rgba(0, 0, 0, 1)',
		sections: [ {
				name: "scrollspinner.js",
				onSpin: function(progress){},
				rubberband: 0,
			},
			{
				name: "Usage",
				scrollDelay: 1500
			},
			{
				name: "not much"
			},
			{
				name: "hey"
			}]
	});
});

// hack to "reset" page location on refresh
window.onload = function(){
	setTimeout(function(){
		scrollTo(0, 0);
	}, 0);
};