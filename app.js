(function() {
	'use strict';

	var CONFIG = {
		maxBubbleRadius: 20,
		dateDomainPadding: 5, // years
		kincaidDomainPadding: .1,
		xAxisLabel: 'Year of address',
		yAxisLabel: 'Flesch–Kincaid Reading Level',
		keyCircleLabel: 'Number of words',
		noneSelectedOpacity: 1,
		selectedOpacity: 1,
		unselectedOpacity: .3,
		row_cells: 4,
		headingText: 'People out-migrating to other country from Nepal'
	};

	var presidents, speeches, selectedSpeech, points;

	var margin = {top: 10, right: 10, bottom: 50, left: 50};

	var width = 940 - margin.left - margin.right,
		height = 400 - margin.top - margin.bottom;

	var gia = d3.select('#gia-sotu');

	var chartContainer = gia.append('div');

	var chart = chartContainer.append('div')
					.attr('id', 'gia-sotu-chart');

	var svg = chart.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);

	chart.append('h1')
		.attr('id', 'gia-sotu-president-header')
		.text(CONFIG.headingText);

	chartContainer
		.style('height', chart.node().offsetHeight + 'px');

	svg = svg.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	var background = svg.append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', width)
			.attr('height', height)
			.style('fill', '#fff')
			.on('mouseout', function(e) { selectedSpeech = null; render(); })
			.on('mousemove', function() { selectByX(d3.mouse(this)[0]) })
			.on('click', scrollToSelected);

	var elPopup = chart.append('div')
					.attr('id', 'gia-sotu-popup');

	var elPresidents = gia.append('div').attr('id', 'gia-sotu-presidents');

	var presidentTemplate = _.template(d3.select('#gia-sotu-presidentTemplate').html());
	var popupTemplate = _.template(d3.select('#gia-sotu-popupTemplate').html());

	var yyyymmdd = d3.time.format('%Y-%m-%d');
	var formatDate = d3.time.format('%-d %B %Y');

	var formatKincaid = d3.format('.1f');

	function portraitUrl(name) {
		return host() + 'img/portraits/' + name.toLowerCase().replace(/[\s.]+/g, '-') + '.jpg';
	}

	function portraitTag(name) {
		return '<img src="' + portraitUrl(name) + '" alt="' + name + '">';
	}

	var helpers = {
		addCommas: d3.format(','),
		portraitUrl: portraitUrl,
		portraitTag: portraitTag,
		formatDate: formatDate,
		formatKincaid: formatKincaid
	};

	var xScale = d3.time.scale()
			.range([0, width]);

	var yScale = d3.scale.linear()
			.range([height, 0]);

	var colors = d3.scale.category10();

	var wordCountScale = d3.scale.sqrt()
							.range([0, CONFIG.maxBubbleRadius]);

	var xAxis = d3.svg.axis()
					.scale(xScale)
					.orient('bottom');

	var yAxis = d3.svg.axis()
					.scale(yScale)
					.orient('left');

	var keyCircle = scaleKeyCircle()
					.scale(wordCountScale)
					.tickValues([3000, 30000]);

	svg.append('g')
		.attr('class', 'x axis')
		.attr('transform', 'translate(0, ' + height + ')')
		.append('text')
			.attr('transform', 'translate(' + (width / 2) + ', 0)')
			.attr('class', 'gia-axisLabel')
			.attr('x', 0)
			.attr('y', 40)
			.style('text-anchor', 'middle')
			.text(CONFIG.xAxisLabel);

	svg.append('g')
		.attr('class', 'y axis')
		.append('text')
			.attr('class', 'gia-axisLabel')
			.attr('transform', 'rotate(90) translate(' + (height / 2) + ' 0)')
			.attr('x', 0)
			.attr('y', 40)
			.style('text-anchor', 'middle')
			.text(CONFIG.yAxisLabel);

	svg.append('g')
		.attr('class', 'circle scale')
		.attr('transform', 'translate(120, ' + (height - CONFIG.maxBubbleRadius * 2) + ')')
		.append('text')
			.attr('class', 'gia-axisLabel')
			.attr('x', 0)
			.attr('y', -CONFIG.maxBubbleRadius * 2 - 4)
			.style('text-anchor', 'middle')
			.text(CONFIG.keyCircleLabel);

	var popupConnectors = svg.append('g')
							.attr('id', 'popupConnectors');

	popupConnectors.append('line').attr('class', 'connector1');
	popupConnectors.append('line').attr('class', 'connector2');

	svg.append('g')
		.attr('class', 'speeches');

	function renderAxis() {
		svg.select('g.x.axis')
			.call(xAxis);

		svg.select('g.y.axis')
			.call(yAxis);

		svg.select('g.circle.scale')
			.call(keyCircle);
	}

	function renderAnnotations() {
		chart.append('div')
			.attr('class', 'gia-sotu-annotation')
			.html('<b>2 December 1823</b><br>James Monroe delivers an address that would later become<br> known as the Monroe Doctrine, a key tenet of US foreign<br> policy for almost two centuries')
			.style('top', margin.top + 'px')
			.style('left', margin.left + 137 + 'px')
			.append('div')
				.attr('class', 'gia-sotu-annotation-line')
				.style('height', '75px')


		chart.append('div')
			.attr('class', 'gia-sotu-annotation')
			.html("<b>2 December 1913</b><br>Woodrow Wilson’s speech follows more than<br> 100 years of the address being delivered to<br> Congress as a written submission. His precedent<br> is (mostly) followed to this day")
			.style('top', margin.top + 'px')
			.style('left', margin.left + 510 + 'px')
			.append('div')
				.attr('class', 'gia-sotu-annotation-line')
				.style('height', '70px')

		chart.append('div')
			.attr('class', 'gia-sotu-annotation')
			.html('<b>3 January 1934</b><br>Franklin D Roosevelt changes<br> the name of the address from<br> the President’s Annual Message<br> to Congress to State of the Union')
			.style('top', margin.top + 75 + 'px')
			.style('left', margin.left + 565 + 'px')
			.append('div')
				.attr('class', 'gia-sotu-annotation-line')
				.style('height', '75px')

		chart.append('div')
			.attr('class', 'gia-sotu-annotation')
			.html("<b>16 January 1981</b><br>Jimmy Carter's final address, delivered as a written message, is the longest ever state of the union")
			.style('top', margin.top + 135 + 'px')
			.style('left', margin.left + 743 + 'px')
			.append('div')
				.attr('class', 'gia-sotu-annotation-line')
				.style('height', '10px')

	}

	function renderPoints() {
		var g = svg.select('g.speeches');

		points = g.selectAll('circle.speech')
					.data(speeches);

		points.enter()
			.append('circle')
			.attr('class', 'speech')
			.attr('cx', function(d) { return xScale(d.date) })
			.attr('cy', function(d) { return yScale(d.kincaid) })
			.attr('r', function(d) { return wordCountScale(d.wc) })
			.attr('fill', function(d) { return colors(d.president.name) })
			// .attr('stroke', function(d) { return d.oral ? '#999' : '#966' })
			.attr('stroke', 'rgba(0,0,0, .05)')
			// .attr('stroke-dasharray', function(d) { return d.oral ? '1, 1' : '1' })
			.on('mouseover', function(d) { selectedSpeech = d; render(); })
			.on('click', scrollToSelected);

		points
			.classed('selected', function(d) { return selectedSpeech && d === selectedSpeech })
			.attr('fill-opacity', function(d) {
				if (selectedSpeech) {
					return d === selectedSpeech ? CONFIG.selectedOpacity : CONFIG.unselectedOpacity;
				} else {
					return CONFIG.noneSelectedOpacity;
				}
			});
	}

	function renderPopup() {
		if (selectedSpeech) {
			var g = svg.select('g.speeches');
			var selectedPoint = g.select('.selected');

			var top = margin.top + 40;
			// var top = Math.round(selectedPoint.attr('cy'));

			var cx = Math.round(selectedPoint.attr('cx'));
			var cy = Math.round(selectedPoint.attr('cy'));
			var flip = cx < width / 2;
			var left = cx;

			popupConnectors
				.style('display', 'block');

			popupConnectors
				.select('.connector1')
					.attr('x1', cx)
					.attr('x2', cx)
					.attr('y1', cy )
					.attr('y2', top + 35);

			popupConnectors
				.select('.connector2')
					.attr('x1', cx)
					.attr('x2', function() { return cx + (flip ? 40 : -40) })
					.attr('y1', top + 35)
					.attr('y2', top + 35);

			var leftPadding = Math.round(wordCountScale(selectedSpeech.wc)) + 26;

			if (flip) {
				left += leftPadding;
			} else {
				left -= parseInt(elPopup.style('width'));
				left -= leftPadding - 40;
			}
			left += margin.left;

			elPopup
				.html(popupTemplate({ speech: selectedSpeech, helpers: helpers}))
				.style('top', top + 'px')
				.style('left', left + 'px')
				.style('display', 'block');
		} else {
			elPopup.style('display', 'none');
			popupConnectors.style('display', 'none');
		}
	}

	function renderPresidents() {
		var presEl = elPresidents.selectAll('div.gia-sotu-president')
			// .data(presidents)
			.data(presidents, function(d) {
				return d.id;
			});

		presEl
			.enter()
				.append('div')
				.attr('class', 'gia-sotu-president')
				.attr('id', function(d) { return 'gia-sotu-president-' + d.id })
				.style('clear', function(d, i) { return i % CONFIG.row_cells === 0 ? 'left' : '' })
				// .style('border-right', function(d, i) { return i % CONFIG.row_cells === 3 ? 'none' : '1px solid #eee' })
				.html(function(d, i) {
					return presidentTemplate({ president: d, ranking: i + 1, helpers: helpers });
				})
				.select('.gia-sotu-speech-years')
					.selectAll('span')
						.data(function(d) { return d.speeches })
						.enter()
							.append('span')
							.on('mouseover', function(d) { selectedSpeech = d; render() })
							.on('mouseout', function(d) { selectedSpeech = null; render() })
							.text(function(d) { return d.date.getFullYear() });

		presEl
			.style('background', function(d) {
				return selectedSpeech && d == selectedSpeech.president ? '#eee' : '#fff' });
	}

	function renderFootnotes() {
		gia.append('div')
			.attr('id', 'gia-sotu-footnotes')
			.html(
				'<p>Presidents James A. Garfield (1881) and William Henry Harrison (1841) did not deliver a State of the Union address.<p>' +
				'<p>Sources: <a href="http://www.presidency.ucsb.edu/sou.php" target="_blank">Gerhard Peters</a> and <a href="http://stateoftheunion.onetwothree.net/texts/" target="_blank">Brad Borevitz</a><p>'
			);
	}

	function render() {
		d3.selectAll('.gia-sotu-annotation').style('display', function() { return selectedSpeech ? 'none' : 'block' });

		renderPoints();
		renderPopup();
		renderPresidents();
	}

	function selectByX(x) {
		var date = new Date(xScale.invert(x)).getTime(), mouseoverSpeech;

		speeches.forEach(function(speech) {
			if (speech.date.getTime() <= date) {
				mouseoverSpeech = speech;
				return;
			}
		});

		if (selectedSpeech !== mouseoverSpeech) {
			selectedSpeech = mouseoverSpeech;
			render();
		}
	}

	function scrollTopTween(scrollTop) {
		return function() {
			var i = d3.interpolateNumber(window.pageYOffset, scrollTop);
			return function(t) { window.scrollTo(0, i(t)); };
		};
	}

	function scrollToSelected() {
		var selector = '#gia-sotu-president-' + selectedSpeech.president.id;
		var pres = d3.select(selector);

		var scroll = gia.node().offsetTop;
		scroll += pres.node().offsetTop - 16; // magic number, perhaps margin of h1 under chart?

		// var element = document.body;

		// // Oh Firefox, you pain me so.
		// element.scrollTop = 1;
		// if (!element.scrollTop) {
		// 	element = document.documentElement;
		// } else {
		// 	element.scrollTop = 0;
		// }

		d3.select(window).transition()
			// .delay(1500)
			.duration(700)
			.tween("scrollTop", scrollTopTween(scroll));


	}

	function setChartPosition() {
		var giaTop = gia.node().offsetTop;
		var giaHeight = gia.node().offsetHeight;
		var chartHeight = chartContainer.node().offsetHeight;

		if (giaTop > window.pageYOffset) {
			chart.style('position', 'absolute');
			chart.style('top', 0);
			return;
		}

		if (giaTop <= window.pageYOffset && window.pageYOffset < giaTop + giaHeight - chartHeight) {
			chart.style('position', 'fixed');
			chart.style('top', 0);
			return;
		}

		chart.style('position', 'absolute');
		chart.style('top', (giaHeight - chartHeight) + 'px');
	}

	function host() {
		if (/guardian|guprod/.exec(document.location.host)) {
			return '//gia.guim.co.uk/2013/02/sotu/';
		}

		return '';
	}

	d3.json('data.json', function(json) {
		presidents = json;

		presidents.forEach(function(president, i) {
			president.id = i;
			president.speeches.forEach(function(speech) {
				speech.date = yyyymmdd.parse(speech.d);
			});
		});

		speeches = [];

		presidents.forEach(function(president) {
			president.speeches.forEach(function(speech) {
				speech.president = president;
				speeches.push(speech);
			});
		});
		// Presidents, assumed to load in speech order, so sorting unnecessary
		// speeches.sort(function(a, b) { return d3.ascending(a.date, b.date) })

		// Sort by least to most readable
		presidents.sort(function(a, b) { return d3.ascending(a.avg_kincaid, b.avg_kincaid) });

		var extentX = d3.extent(speeches, function(d) { return d.date });
		var extentY = d3.extent(speeches, function(d) { return d.kincaid });
		var maxWordCount = d3.max(speeches, function(d) { return d.wc });

		// // pad the domain of the dates, is there a better way to do this?
		var startDate = new Date(extentX[0].getTime()).setFullYear(extentX[0].getFullYear() - CONFIG.dateDomainPadding);
		var endDate = new Date(extentX[1].getTime()).setFullYear(extentX[1].getFullYear() + CONFIG.dateDomainPadding);

		// // pad the domain of the kincaid, is there a better way to do this?
		extentY[0] *= (1 - CONFIG.kincaidDomainPadding);
		extentY[1] *= (1 + CONFIG.kincaidDomainPadding);

		xScale.domain([startDate, endDate]);
		yScale.domain(extentY);
		wordCountScale.domain([0, maxWordCount]);

		renderAxis();
		render();
		renderAnnotations();
		renderFootnotes();

		window.onscroll = setChartPosition;
		setChartPosition();
	});

	function scaleKeyCircle() {
		var scale,
				orient = "left",
				tickPadding = 3,
				tickExtend = 5,
				tickArguments_ = [5],
				tickValues = null,
				tickFormat_

		function key(g) {
			g.each(function() {
				var g = d3.select(this);

				// Ticks, or domain values for ordinal scales.
				var ticks = tickValues == null ? (scale.ticks ? scale.ticks.apply(scale, tickArguments_) : scale.domain()) : tickValues,
						tickFormat = tickFormat_ == null ? (scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments_) : String) : tickFormat_;

				ticks = ticks.slice().reverse()

				ticks.forEach(function(tick) {
					var gg = g.append('g')
						.attr('class', 'circleKey')
						.attr('transform', 'translate(0,' + - scale(tick) + ')' )

					gg.append('circle')
						.attr('cx', 0)
						.attr('cy', 0)
						.attr('r', scale(tick))

					var x1 = scale(tick),
							x2 = tickExtend + scale(ticks[0]),
							tx = x2 + tickPadding,
							textAnchor = "start"

					if ("left" == orient) {
						x1 = -x1
						x2 = -x2
						tx = -tx
						textAnchor = "end"
					}

					gg.append('line')
						.attr('x1', x1)
						.attr('x2', x2)
						.attr('y1', 0)
						.attr('y2', 0)
						.attr('stroke', '#000')
						.text(tick)

					gg.append('text')
						.attr('transform', 'translate('+ tx +', 0)' )
						.attr('dy', '.35em')
						.style('text-anchor', textAnchor)
						.text(tickFormat(tick))
				})

			})
		}

		key.scale = function(value) {
			if (!arguments.length) return scale;
			scale = value;
			return key;
		};

		key.orient = function(value) {
			if (!arguments.length) return orient;
			orient = value;
			return key;
		};

		key.ticks = function() {
			if (!arguments.length) return tickArguments_;
			tickArguments_ = arguments;
			return key;
		};

		key.tickFormat = function(x) {
			if (!arguments.length) return tickFormat_;
			tickFormat_ = x;
			return key;
		};

		key.tickValues = function(x) {
			if (!arguments.length) return tickValues;
			tickValues = x;
			return key;
		};

		key.tickPadding = function(x) {
			if (!arguments.length) return tickPadding;
			tickPadding = +x;
			return key;
		};

		key.tickExtend = function(x) {
			if (!arguments.length) return tickExtend;
			tickExtend = +x;
			return key;
		};

		key.width = function(value) {
			if (!arguments.length) return width;
			width = value;
			return key;
		};

		key.height = function(value) {
			if (!arguments.length) return height;
			height = value;
			return key;
		};

		return key;
	}

})();
