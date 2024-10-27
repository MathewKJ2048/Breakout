HEIGHT = window.innerHeight
WIDTH = window.innerWidth
SCALE = 32

BOARD_WIDTH_HALF = 16
BOARD_LENGTH = 32

BALL_RADIUS = 0.5

BACKGROUND_COLOR = 'black'
WALL_COLOR = 'grey'
WALL_LINE_COLOR = 'white'
BALL_LINE_COLOR = 'black'
BALL_COLOR = 'white'

var canvas = document.querySelector("canvas")
canvas.width = WIDTH
canvas.height = HEIGHT
var c = canvas.getContext("2d");

class Vector {
	constructor(x, y, z) {
		this.x = x
		this.y = y
		this.z = z
	}
}
function add(v1, v2) {
	return new Vector(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z)
}
function multiply(v, k) {
	return new Vector(v.x * k, v.y * k, v.z * k)
}
function magnitude(v) {
	return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}
function dist(v1, v2) {
	var d1 = v1.x - v2.x
	var d2 = v1.y - v2.y
	var d3 = v1.z - v2.z
	return Math.sqrt(d1 * d1 + d2 * d2 + d3 * d3)
}
class Ball {
	constructor(r, v) {
		this.r = r
		this.v = v
		this.radius = BALL_RADIUS
		this.color = BALL_COLOR
		this.outline_color = BALL_LINE_COLOR
	}
}
class Block {
	constructor(r, color) {
		this.r = r
		this.color = color
		this.active = true
	}
}
class Particle {
	constructor(r, v, color, radius) {
		this.r = r
		this.v = v
		this.color = color
		this.radius = radius
		this.active = true
	}
}



const camera = new Vector(0, -32, 24)
const ball = new Ball(new Vector(0, 10, 0.5), new Vector(0.05, 0.2, 0))
const blocks = []
let particles = []
const gravity = -0.01
const breakage = 5
const BAT_RADIUS = 4
const bat = new Vector(0, -2, 0.5)

function init() {
	START = 20
	for (i = -BOARD_WIDTH_HALF; i < BOARD_WIDTH_HALF; i++) {
		blocks.push(new Block(new Vector(i + 0.5, START + 5.5, 0.5), "red"))
		blocks.push(new Block(new Vector(i + 0.5, START + 4.5, 0.5), "orange"))
		blocks.push(new Block(new Vector(i + 0.5, START + 3.5, 0.5), "yellow"))
		blocks.push(new Block(new Vector(i + 0.5, START + 2.5, 0.5), "green"))
		blocks.push(new Block(new Vector(i + 0.5, START + 1.5, 0.5), "blue"))
		blocks.push(new Block(new Vector(i + 0.5, START + 0.5, 0.5), "purple"))
	}


	const key = (b1, b2) => {

		let d1 = dist(camera, b1.r)
		let d2 = dist(camera, b2.r)
		if (d1 > d2) { return -1; }
		else if (d2 > d1) { return 1; }
		else return 0
	}
	console.log(blocks)
	blocks.sort(key)
	console.log(blocks)

}
init()

function project(v) {
	// draw line from camera to point
	// find intercept with y=0
	/*
	x-cx/vx-cx = y-cy/vy-cy = z-cz/vz-cz
	x-cx/vx-cx = -cy/vy-cy = z-cz/vz-cz
	*/
	let t = -camera.y / (v.y - camera.y)
	let x = (v.x - camera.x) * t + camera.x
	let z = (v.z - camera.z) * t + camera.z
	return [WIDTH / 2 + x * SCALE, HEIGHT / 1.2 - z * SCALE]
}
function project_inverse(coord, y) {
	let x = (coord[0] - WIDTH / 2) / SCALE
	let z = (HEIGHT / 1.2 - coord[1]) / SCALE
	let t = -camera.y / (y - camera.y)
	return new Vector((x - camera.x) / t + camera.x, y, (z - camera.z) / t + camera.z)
}


function spray(b)
{
	r = b.r
	for(i=0;i<breakage*breakage*breakage;i++)
	{
		theta = Math.random() * Math.PI * 2
				phi = Math.random() * Math.PI / 4 + Math.PI/4
				v = multiply(new Vector(
				Math.cos(theta) * Math.cos(phi), 
				Math.sin(theta) * Math.cos(phi), 
				Math.sin(phi)), 
				0.4)
				p = new Particle(r, v, b.color, 1 / breakage)
				particles.push(p)
	}
				
}
function explode(b) {
	b.active = false
	
	for (i = 0; i < breakage; i++) {
		for (j = 0; j < breakage; j++) {
			for (k = 0; k < breakage; k++) {
				fx = (i + 0.5) / breakage
				fy = (j + 0.5) / breakage
				fz = (k + 0.5) / breakage
				r = add(b.r, new Vector(-0.5, -0.5, -0.5))
				r = add(r, new Vector(fx, fy, fz))
				theta = Math.random() * Math.PI * 2
				phi = Math.random() * Math.PI / 4 + Math.PI/4
				v = multiply(new Vector(
				Math.cos(theta) * Math.cos(phi), 
				Math.sin(theta) * Math.cos(phi), 
				Math.sin(phi)), 
				0.4)
				p = new Particle(r, v, b.color, 1 / breakage)
				particles.push(p)

			}
		}

	}
}


function physics(dt) {



	// board edges
	if (ball.r.x + ball.radius > BOARD_WIDTH_HALF) {
		ball.v.x = -Math.abs(ball.v.x)
	}
	if (ball.r.x - ball.radius < -BOARD_WIDTH_HALF) {
		ball.v.x = Math.abs(ball.v.x)
	}
	if (ball.r.y + ball.radius > BOARD_LENGTH) {
		ball.v.y = -Math.abs(ball.v.y)
	}
	if (ball.r.y - ball.radius < 0) {
		spray(ball)
		ball.v.y = Math.abs(ball.v.y)
		ball.r = new Vector(0,10,0.5)
	}

	// bat reflections
	diff = add(ball.r, multiply(bat, -1))
	if (magnitude(diff) < BAT_RADIUS && diff.x * ball.v.x + diff.y * ball.v.y < 0) {
		normal = multiply(diff, 1 / magnitude(diff))
		dot_n = normal.x * ball.v.x + normal.y * ball.v.y
		ball.v = add(multiply(normal, -2 * dot_n), ball.v)
		// -u + v = 2*(-u).n n
	}

	// block reflections


	/*
	let x, y be ball's position
	let X, Y be block's position
	let T = side of block (complete)
	x-X, y-Y = coordinates of ball in frame where block is at origin

	*/
	for (b of blocks) {
		if (!b.active) {
			continue
		}
		let x = ball.r.x - b.r.x
		let y = ball.r.y - b.r.y
		let T = 1
		p = new Particle(b.r, new Vector(0, 0, 0.2), b.color, ball.radius)
		if (y < T / 2 + ball.radius && y > T / 2 && Math.abs(x) < T / 2) {
			ball.v.y = Math.abs(ball.v.y)
			explode(b)
		}
		if (-y < T / 2 + ball.radius && -y > T / 2 && Math.abs(x) < T / 2) {
			ball.v.y = -Math.abs(ball.v.y)
			explode(b)
		}
		if (x < T / 2 + ball.radius && x > T / 2 && Math.abs(y) < T / 2) {
			ball.v.x = Math.abs(ball.v.x)
			explode(b)
		}
		if (-x < T / 2 + ball.radius && -x > T / 2 && Math.abs(y) < T / 2) {
			ball.v.x = -Math.abs(ball.v.x)
			explode(b)
		}
	}
	ball.r = add(ball.r, multiply(ball.v, dt))


	new_particles = []
	for (p of particles) {
		p.v = add(p.v, multiply(new Vector(0, 0, gravity), dt))
		p.r = add(p.r, multiply(p.v, dt))
		if (true) {
			new_particles.push(p)
		}
		if(p.r.z <0 && p.v.z<0)
		{
			p.v.z = Math.abs(p.v.z)*0.5
		}

	}
	particles = new_particles

}

function draw_grid() {

	ul = project(new Vector(-BOARD_WIDTH_HALF, BOARD_LENGTH, 0))
	ur = project(new Vector(BOARD_WIDTH_HALF, BOARD_LENGTH, 0))
	dl = project(new Vector(-BOARD_WIDTH_HALF, 0, 0))
	dr = project(new Vector(BOARD_WIDTH_HALF, 0, 0))
	ul_ = project(new Vector(-BOARD_WIDTH_HALF, BOARD_LENGTH, 1))
	ur_ = project(new Vector(BOARD_WIDTH_HALF, BOARD_LENGTH, 1))
	dl_ = project(new Vector(-BOARD_WIDTH_HALF, 0, 1))
	dr_ = project(new Vector(BOARD_WIDTH_HALF, 0, 1))

	c.fillStyle = WALL_COLOR
	c.beginPath()
	c.moveTo(ul[0], ul[1])
	c.lineTo(ur[0], ur[1])
	c.lineTo(dr[0], dr[1])
	c.lineTo(dl[0], dl[1])
	c.closePath()
	c.fill()
	c.beginPath()
	c.moveTo(ur[0], ur[1])
	c.lineTo(ul[0], ul[1])
	c.lineTo(ul_[0], ul_[1])
	c.lineTo(ur_[0], ur_[1])
	c.closePath()
	c.fill()
	c.beginPath()
	c.moveTo(ul[0], ul[1])
	c.lineTo(dl[0], dl[1])
	c.lineTo(dl_[0], dl_[1])
	c.lineTo(ul_[0], ul_[1])
	c.closePath()
	c.fill()
	c.beginPath()
	c.moveTo(ur[0], ur[1])
	c.lineTo(dr[0], dr[1])
	c.lineTo(dr_[0], dr_[1])
	c.lineTo(ur_[0], ur_[1])
	c.closePath()
	c.fill()

	c.strokeStyle = WALL_LINE_COLOR
	c.beginPath()
	c.moveTo(dl_[0], dl_[1])
	c.lineTo(ul_[0], ul_[1])
	c.lineTo(ur_[0], ul_[1])
	c.lineTo(dr_[0], dr_[1])
	c.stroke()

	for (i = -BOARD_WIDTH_HALF; i <= BOARD_WIDTH_HALF; i++) {
		p = project(new Vector(i, 0, 0))
		p_ = project(new Vector(i, 0, 1))
		q = project(new Vector(i, BOARD_LENGTH, 0))
		q_ = project(new Vector(i, BOARD_LENGTH, 1))
		c.strokeStyle = WALL_LINE_COLOR
		c.beginPath()
		c.moveTo(p[0], p[1])
		c.lineTo(q[0], q[1])
		c.moveTo(q[0], q[1])
		c.lineTo(q_[0], q_[1])
		c.stroke()
	}
	for (j = 0; j <= BOARD_LENGTH; j++) {
		p = project(new Vector(BOARD_WIDTH_HALF, j, 0))
		p_ = project(new Vector(BOARD_WIDTH_HALF, j, 1))
		q = project(new Vector(-BOARD_WIDTH_HALF, j, 0))
		q_ = project(new Vector(-BOARD_WIDTH_HALF, j, 1))
		c.strokeStyle = WALL_LINE_COLOR
		c.beginPath()
		c.moveTo(p[0], p[1])
		c.lineTo(q[0], q[1])
		c.moveTo(p[0], p[1])
		c.lineTo(p_[0], p_[1])
		c.moveTo(q[0], q[1])
		c.lineTo(q_[0], q_[1])
		c.stroke()
	}
}

function draw_particles() {
	for (p of particles) {
		d1 = dist(p.r, camera)
		d2 = Math.sqrt(camera.x * camera.x + camera.z * camera.z)

		rad = p.radius * SCALE * d2 / d1
		pr = project(p.r)
		c.fillStyle = p.color
		c.beginPath()
		c.arc(pr[0], pr[1], rad, 0, 2 * Math.PI)
		c.fill()
	}

}

function draw_ball(b) {
	d1 = dist(b.r, camera)
	d2 = Math.sqrt(camera.x * camera.x + camera.z * camera.z)

	rad = b.radius * SCALE * d2 / d1
	p = project(b.r)
	c.fillStyle = b.color
	c.beginPath()
	c.arc(p[0], p[1], rad, 0, 2 * Math.PI)
	c.fill()
	c.strokeStyle = b.outline_color
	c.beginPath()
	c.arc(p[0], p[1], rad, 0, 2 * Math.PI)
	c.stroke()
}
function sub_draw_square(ul, ur, dr, dl) {
	c.beginPath()
	c.moveTo(ul[0], ul[1])
	c.lineTo(ur[0], ur[1])
	c.lineTo(dr[0], dr[1])
	c.lineTo(dl[0], dl[1])
	c.closePath()
}
function draw_block(b) {
	t = 0.5
	ul = project(add(b.r, new Vector(-t, t, t)))
	dl = project(add(b.r, new Vector(-t, -t, t)))
	ur = project(add(b.r, new Vector(t, t, t)))
	dr = project(add(b.r, new Vector(t, -t, t)))
	ul_ = project(add(b.r, new Vector(-t, t, -t)))
	dl_ = project(add(b.r, new Vector(-t, -t, -t)))
	ur_ = project(add(b.r, new Vector(t, t, -t)))
	dr_ = project(add(b.r, new Vector(t, -t, -t)))

	c.fillStyle = b.color
	c.strokeStyle = WALL_LINE_COLOR

	sub_draw_square(ul, dl, dl_, ul_)
	c.fill()
	sub_draw_square(ul, dl, dl_, ul_)
	c.stroke()
	sub_draw_square(ur, dr, dr_, ur_)
	c.fill()
	sub_draw_square(ur, dr, dr_, ur_)
	c.stroke()
	sub_draw_square(ul, ur, dr, dl)
	c.fill()
	sub_draw_square(ul, ur, dr, dl)
	c.stroke()
	sub_draw_square(dl, dr, dr_, dl_)
	c.fill()
	sub_draw_square(dl, dr, dr_, dl_)
	c.stroke()


}

function draw_bat() {
	N = 64
	for (i = 0; i <= N; i += 1) {
		let theta = i * Math.PI / N
		let x = (BAT_RADIUS - 2 * BALL_RADIUS) * Math.cos(theta)
		let y = (BAT_RADIUS - 2 * BALL_RADIUS) * Math.sin(theta)
		vb = add(bat, new Vector(x, y, 0.5), new Vector(0, 0, 0))
		if (Math.abs(vb.x) <= BOARD_WIDTH_HALF && vb.y >= 0) {
			b = new Ball(vb)
			b.outline_color = BALL_COLOR
			draw_ball(b)
		}
	}
}

function render() {
	c.fillStyle = BACKGROUND_COLOR
	c.fillRect(0, 0, WIDTH, HEIGHT)
	draw_grid()

	dist_ball = dist(ball.r, camera)
	ball_drawn = false
	for (b of blocks) {
		if (!b.active) {
			continue
		}
		dist_block = dist(camera, b.r)
		if (dist_ball > dist_block && !ball_drawn) {
			ball_drawn = true
			draw_ball(ball)
		}
		draw_block(b)
	}
	if (!ball_drawn) {
		draw_ball(ball)
	}
	draw_bat()
	draw_particles()

	//test
	/*
	left = project(new Vector(100,0,0))
	right = project(new Vector(-100,0,0))
	up = project(new Vector(0,1,0))
	down = project(new Vector(0,-1,0))

	c.strokeStyle = "red"
	c.beginPath()
	c.moveTo(left[0],left[1])
	c.lineTo(right[0],right[1])
	c.moveTo(up[0],up[1])
	c.lineTo(down[0],down[1])
	c.closePath()
	c.stroke()
	*/
}

function animate() {
	render()
	physics(1)
	window.requestAnimationFrame(animate);
}
window.requestAnimationFrame(animate);

canvas.addEventListener("mousemove", function (event) {
	coords = [event.x, event.y]
	v = project_inverse(coords, 0)
	bat.x = v.x

})



/*
SCALE = 16
LINE_COLOR = "grey"
BACKGROUND = "black"
SQUARE = "white"
MAX_SCALE = 32
MIN_SCALE = 4

PLAYING = false

var canvas = document.querySelector("canvas")
const step_button = document.getElementById("step_button")
const play_button = document.getElementById("play_button")
const clear_button = document.getElementById("clear_button")
const zoom_in = document.getElementById("zoom_in")
const zoom_out = document.getElementById("zoom_out")
const up_button = document.getElementById("up")
const down_button = document.getElementById("down")
const left_button = document.getElementById("left")
const right_button = document.getElementById("right")
canvas.width = WIDTH
canvas.height = HEIGHT
var c = canvas.getContext("2d");

class Vector {
	constructor(x, y) {
		this.x = x
		this.y = y
	}
}
const camera = new Vector(0, 0)
const mouse = new Vector(undefined, undefined)
var cells = new Set()

function transform_point(p) {
	z = new Vector(0, 0)
	z.x = (p.x - camera.x) * SCALE + WIDTH / 2
	z.y = HEIGHT / 2 - (p.y - camera.y) * SCALE
	return z
}
function stringify(p)
{
	return p.x+"|"+p.y
}
function inverse_transform_point(z){
	p = new Vector(0, 0)
	p.x = (z.x-WIDTH/2)/SCALE + camera.x
	p.y = (HEIGHT/2 - z.y)/SCALE + camera.y
	return p
}
function drawHorizontal(p, color)
{
	z = transform_point(p)
	c.strokeStyle = color
	c.beginPath()
	c.moveTo(0, z.y)
	c.lineTo(WIDTH, z.y)
	c.stroke()
}
function drawVertical(p, color)
{
	z = transform_point(p)
	c.strokeStyle = color
	c.beginPath()
	c.moveTo(z.x, 0)
	c.lineTo(z.x, HEIGHT)
	c.stroke()
}
function in_screen(p)
{
	z = transform_point(p)
	return z.x >= 0 && z.x <= WIDTH && z.y >=0 && z.y <= HEIGHT
}
function drawGrid()
{
	num_h = Math.floor(HEIGHT/SCALE)
	for(y=-num_h;y<=num_h;y++)
	{
		p = new Vector(camera.x,camera.y+y+0.5)
		if(in_screen(p))
		{
			drawHorizontal(p,LINE_COLOR)
		}
	}
	num_w = Math.floor(WIDTH/SCALE)
	for(x=-num_w;x<=num_w;x++)
	{
		p = new Vector(camera.x+x+0.5,camera.y)
		if(in_screen(p))
		{
			drawVertical(p,LINE_COLOR)
		}
	}
}


function step()
{
	console.log(cells)
	cell_int = []
	for(const t_ of cells)
	{
		coords = t_.split("|")
		cell_int.push(new Vector(
			parseInt(coords[0]),parseInt(coords[1])
		))
	}
	console.log(cell_int)
	cells_to_compute = []
	for(const t of cell_int)
	{
		u = new Vector(t.x,t.y+1)
		d = new Vector(t.x,t.y-1)
		l = new Vector(t.x-1,t.y)
		r = new Vector(t.x+1,t.y)
		ul = new Vector(t.x+1,t.y+1)
		ur = new Vector(t.x+1,t.y-1)
		dl = new Vector(t.x-1,t.y+1)
		dr = new Vector(t.x-1,t.y-1)
		cells_to_compute.push(t)
		cells_to_compute.push(u)
		cells_to_compute.push(l)
		cells_to_compute.push(r)
		cells_to_compute.push(d)
		cells_to_compute.push(ul)
		cells_to_compute.push(ur)
		cells_to_compute.push(dl)
		cells_to_compute.push(dr)
	}
	console.log(cells_to_compute)
	next_cell_set = new Set()
	for(const t of cells_to_compute)
	{
		u = new Vector(t.x,t.y+1)
		d = new Vector(t.x,t.y-1)
		l = new Vector(t.x-1,t.y)
		r = new Vector(t.x+1,t.y)
		ul = new Vector(t.x+1,t.y+1)
		ur = new Vector(t.x+1,t.y-1)
		dl = new Vector(t.x-1,t.y+1)
		dr = new Vector(t.x-1,t.y-1)
		neighbours = [u,l,d,r,ul,ur,dl,dr]
		ct=0
		for(n of neighbours)
		{
			if(cells.has(stringify(n)))
			{
				ct+=1
			}
		}
		if(cells.has(stringify(t)))
		{
			if(ct==2 || ct==3)
			{next_cell_set.add(stringify(t));	
			console.log("continue"+ct)}
		}
		else
		{
			if(ct==3)
			{next_cell_set.add(stringify(t));
			console.log("born"+ct)}
		}
	}
	console.log(next_cell_set)
	cells = next_cell_set
}
step_button.addEventListener("click",function(event){
	step()
	console.log("button pressed")
})
clear_button.addEventListener("click",function(event){
	cells = new Set()
})
zoom_in.addEventListener("click",function(event){
	if(SCALE<MAX_SCALE)SCALE+=1
})
zoom_out.addEventListener("click",function(event){
	if(SCALE>MIN_SCALE)SCALE-=1
})
play_button.addEventListener("click",function(main){
	PLAYING = !PLAYING
	console.log(PLAYING)
	if(PLAYING)
	{
		document.getElementById("play_button").innerHTML = "||"
	}
	else
	{
		document.getElementById("play_button").innerHTML = "▶"
	}
})
up_button.addEventListener("click",function(main){
	camera.y+=SCALE
})
down_button.addEventListener("click",function(main){
	camera.y-=SCALE
})
left_button.addEventListener("click",function(main){
	camera.x-=SCALE
})
right_button.addEventListener("click",function(main){
	camera.x+=MAX_SCALE/SCALE
})



canvas.addEventListener("mousemove",function(event)
{
	mouse.x = event.x
	mouse.y = event.y
	z = new Vector(mouse.x, mouse.y)
	p = inverse_transform_point(z)
	p.x = Math.round(p.x)
	p.y = Math.round(p.y)
	t = stringify(p)
	if(!cells.has(t))
	{
		cells.add(t)
	}})



function animate() {



	requestAnimationFrame(animate);
	c.fillStyle = BACKGROUND
	c.fillRect(0, 0, WIDTH, HEIGHT)



	for(const t_ of cells)
	{
		c.fillStyle = SQUARE
		coords = t_.split("|")
		t = new Vector(parseInt(coords[0]),parseInt(coords[1]))
		rt = transform_point(new Vector(t.x+0.5,t.y+0.5))
		lb = transform_point(new Vector(t.x-0.5,t.y-0.5))
		c.fillRect(lb.x,lb.y,rt.x-lb.x,rt.y-lb.y)

	}
	drawGrid()

	if(PLAYING)
	{
		step()
	}

}
animate()


*/
