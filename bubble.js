(
    function () {
        'use strict'

        var Config = {
            chartWidth: 960,
            chartHeight: 400,
            title: 'Demo Chart',
            padding: 70,
            xTicks: 5,
            yTicks: 5,
            xAxisLabel: 'Years',
            yAxisLabel: 'No of people'
        }

        var margin = { top: 10, right: 10, bottom: 50, left: 50 };

        var chartDiv = d3.select('#bubbleChart')

        chartDiv.style('width', Config.chartWidth)

        var hoverData = null

        var selectedCircle = undefined

        var svg = chartDiv.append('svg')
            .attr('width', Config.chartWidth)
            .attr('height', Config.chartHeight)
            .attr('padding', 20)

        chartDiv.append('h3').text(Config.title)

        var dataset = undefined
        var maxX, xScale, yScale, rScale, colorXScale, colorYScale;

        var elPopup = chartDiv.append('div')
            .attr('class', 'popup')

        var popup = _.template(d3.select('#toolTip').html())

        d3.json('demodata.json', function (error, data) {
            if (error == null || error == undefined) {
                dataset = data;

                renderTheGraph()
            } else {
                window.alert('Something wrond happened while loading the data from JSON file. Try again.')
            }
        })

        function renderTheGraph() {

            setScales()

            plotPoints()

            renderAxis()
        }

        function setScales() {

            xScale = d3.scale.linear()
                .domain([d3.min(dataset, function (d) { return d.Date }) - 1, d3.max(dataset, function (d) { return d.Date })])
                .range([Config.padding, Config.chartWidth - Config.padding])
            // .tickFormat(function (d, i) { return tickLabel[i] })


            var maleMin = d3.min(dataset, function (d) { return d.Male })
            var femaleMin = d3.min(dataset, function (d) { return d.Female })

            var maleMax = d3.max(dataset, function (d) { return d.Male })
            var femaleMax = d3.max(dataset, function (d) { return d.Female })

            yScale = d3.scale.linear()
                .domain([Math.min(maleMin, femaleMin), Math.max(maleMax, femaleMax)])
                .range([(Config.chartHeight - Config.padding), 0 + (Config.padding / 2)])

            rScale = d3.scale.linear()
                .domain([0, 1])
                .range([5, 15])
        }

        function renderAxis() {
            var tickLabel = ['']

            dataset.forEach(eachData => {
                tickLabel.push(eachData.DateLabel)
            });

            //rendering xAxis
            var xAxis = d3.svg.axis()
            xAxis.scale(xScale)
            xAxis.orient('bottom')
            xAxis.tickFormat(function (d, i) { return tickLabel[i] })

            svg.append('g')
                .attr('class', 'axis')
                .attr('transform', 'translate(0,' + (Config.chartHeight - Config.padding) + ')')
                .call(xAxis)

            //text label for x axis
            svg.append('text')
                .attr('transform', 'translate(' + (Config.chartWidth / 2) + ', ' + (Config.chartHeight - 20) + ')')
                .style('text-anchor', 'middle')
                .text(Config.xAxisLabel)

            //rendering yAxis
            var yAxis = d3.svg.axis()
            yAxis.scale(yScale)
            yAxis.orient('left')
            yAxis.ticks(Config.yTicks)

            svg.append('g')
                .attr('class', 'axis')
                .attr('transform', 'translate(' + Config.padding + ',0)')
                .call(yAxis)

            //text lable for y axis
            svg.append('text')
                .attr('transform', 'rotate(-90)')
                .attr('y', 0)
                .attr('x', 0 - (Config.chartHeight / 2))
                .attr('dy', '1em')
                .style('text-anchor', 'middle')
                .text(Config.yAxisLabel)
        }

        function plotPoints() {

            plotMalePoint()

            plotFemalePoint()

        }

        function plotMalePoint() {
            var maleCircle = svg.selectAll('.male.circle')
                .data(dataset)

            maleCircle.enter()
                .append('circle')
                .attr('class', 'circle-points')
                .attr('cx', function (d) {
                    return xScale(d.Date);
                })
                .attr('cy', function (d) {
                    return yScale(d.Male);
                })
                .attr('r', function (d) {
                    var weight = getWeight(d.Male, d.Total)
                    return rScale(weight);
                })
                .attr('opacity', '0.3')
                .attr('fill', 'orange')
                .on('mouseover', function (d) {
                    hoverData = d
                    this.classList.add('selected')
                    renderPopup()
                })
                .on('mouseout', function (d) {
                    hoverData = null
                    this.classList.remove('selected')
                    selectedCircle = null
                    hidePopup()
                })

        }

        function plotFemalePoint() {
            var femaleCircle = svg.selectAll('.female .circle')
                .data(dataset)
                .enter()
                .append('circle')

            femaleCircle.attr('cx', function (d) {
                return xScale(d.Date);
            })
                .attr('class', 'circle-points')
                .attr('cy', function (d) {
                    return yScale(d.Female);
                })
                .attr('r', function (d) {
                    var weight = getWeight(d.Female, d.Total)
                    return rScale(weight);
                })
                .attr('fill', 'blue')
                .attr('opacity', '0.3')
                .on('mouseover', function (d) {
                    hoverData = d
                    this.classList.add('selected')
                    renderPopup()
                })
                .on('mouseout', function (d) {
                    hoverData = null
                    this.classList.remove('selected')
                    selectedCircle = null
                    hidePopup()
                })
        }

        function getWeight(number, total) {
            return Number((number / total)).toFixed(2)
        }

        function renderPopup() {
            var x = 0
            var y = 0
            var selectedCircle = svg.select('.selected')
            if (selectedCircle && selectedCircle != null) {
                if (selectedCircle.attr('cx')) {
                    x = Number(selectedCircle.attr('cx'))
                    y = Number(selectedCircle.attr('cy'))
                }
            }

            var chartMidx = Config.chartWidth / 2
            var chartMidy = Config.chartHeight / 2

            if (hoverData) {
                elPopup.html(popup({ demo: hoverData }))
                elPopup.attr('class', 'tool-tip')
                if (y < chartMidy) {
                    y -= 15
                    elPopup.style('top', y + 'px')
                    elPopup.style('bottom', 'auto')
                } else {
                    y = Config.chartHeight - y + 40
                    elPopup.style('top', 'auto')
                    elPopup.style('bottom', y + 'px')
                }
                if (x < chartMidx) {
                    x += 20
                    elPopup.style('right', 'auto')
                    elPopup.style('left', x + 'px')
                } else {
                    x = Config.chartWidth - x + 20
                    elPopup.style('left', 'auto')
                    elPopup.style('right', x + 'px')
                }
                console.log(x)
                elPopup.style('position', 'absolute')
                elPopup.style('display', 'block')
            } else {
                elPopup.html('')
                elPopup.style('display', 'none')
            }
        }

        function hidePopup() {
            elPopup.style('display', 'none')
        }
    }
)()