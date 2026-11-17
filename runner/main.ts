// micro:bit "runner" for the picture-block app (screen, sound, buttons and the Elecfreaks TPBot / TPBot Edu).
// The app does all the thinking; this program only
//   - shows the LED picture the app sends          "L" + 7 hex digits   e.g. L00a2a8c
//   - plays a tone the app sends                    "T" + frequency + "," + milliseconds
//   - sets the TPBot headlights                     "H" + rrggbb (hex)
//   - starts/stops sending the robot's sensors      "S1" / "S0"  ->  the app gets "Q" + distance_cm + "," + line  (line = 1 when both floor sensors see black; distance 0 = no echo)
//   plain TPBot (timed moves):
//   - sets the wheels                               "W" + left + "," + right   (-100..100;  W0,0 = stop)
//   TPBot Edu (encoder motors + gyroscope, exact moves; the robot answers "K" when it has arrived):
//   - drives an exact distance                      "GF" / "GB" + centimetres     e.g. GF40
//   - turns on the spot by an exact angle           "RL" / "RR" + degrees         e.g. RR90
//   - drives until told otherwise                   "V" + left + "," + right      (cm/s, 20..50, negative = backwards)
//   - sets the speed of the exact moves             "P" + cm/s (20..50)
//   - tells the app about button A, button B and shake  ("A", "B", "H" + newline)
// Make it once in https://makecode.microbit.org:
//   Extensions -> bluetooth, and Extensions -> paste https://github.com/elecfreaks/pxt-TPBot
//   Project Settings -> "No Pairing Required".  Download the .hex and copy it onto the MICROBIT drive.

bluetooth.startUartService()

const NL = serial.delimiters(Delimiters.NewLine)

let streaming = false
function startStream() {
    control.inBackground(function () {
        while (streaming) {
            const d = Math.round(TPBot.sonarReturn(TPBot.SonarUnit.Centimeters, 100))
            const l = TPBot.trackLine(TPBot.TrackingState.L_R_line) ? 1 : 0
            bluetooth.uartWriteString("Q" + d + "," + l + "\n")
            basic.pause(120)
        }
    })
}

// An exact move waits inside the extension until the robot has arrived, so it runs in the background
// and the program stays free to receive "stop". The app is told with "K" (only if nothing newer started).
let moveToken = 0
function startMove(job: () => void) {
    moveToken++
    const mine = moveToken
    control.inBackground(function () {
        job()
        if (mine == moveToken) {
            bluetooth.uartWriteString("K\n")
        }
    })
}

function stopRobot() {
    moveToken++
    TPBot.stopCar()
}

function showBits(bits: number) {
    for (let i = 0; i < 25; i++) {
        if ((bits >> i) & 1) {
            led.plot(i % 5, Math.idiv(i, 5))
        } else {
            led.unplot(i % 5, Math.idiv(i, 5))
        }
    }
}

bluetooth.onUartDataReceived(NL, function () {
    const line = bluetooth.uartReadUntil(NL)
    const cmd = line.charAt(0)
    if (cmd == "L") {
        showBits(parseInt(line.substr(1, 7), 16))
    } else if (cmd == "T") {
        const parts = line.substr(1).split(",")
        const freq = parseInt(parts[0])
        const ms = parseInt(parts[1])
        control.inBackground(function () {
            music.playTone(freq, ms)
        })
    } else if (cmd == "W") {
        const parts = line.substr(1).split(",")
        const l = parseInt(parts[0])
        const r = parseInt(parts[1])
        if (l == 0 && r == 0) {
            stopRobot()
        } else {
            moveToken++
            TPBot.setWheels(l, r)
        }
    } else if (cmd == "G") {
        const cm = parseInt(line.substr(2))
        const forward = line.charAt(1) == "F"
        startMove(function () {
            TPBot.pidRunDistance(forward ? TPBot.Direction.Forward : TPBot.Direction.Backward, cm, TPBot.DistanceUnit.Cm)
        })
    } else if (cmd == "R") {
        const deg = parseInt(line.substr(2))
        const left = line.charAt(1) == "L"
        startMove(function () {
            TPBot.pidRunSteering(left ? TPBot.TurnUnit.Stay_Leftsteering : TPBot.TurnUnit.Stay_Rightsteering, deg)
        })
    } else if (cmd == "V") {
        const parts = line.substr(1).split(",")
        moveToken++
        TPBot.pidSpeedControl(parseInt(parts[0]), parseInt(parts[1]), TPBot.SpeedUnit.Cm_s)
    } else if (cmd == "P") {
        TPBot.pidSetSpeed(parseInt(line.substr(1)), TPBot.SpeedUnit.Cm_s)
    } else if (cmd == "H") {
        TPBot.headlightColor(parseInt(line.substr(1, 6), 16))
    } else if (cmd == "S") {
        if (line.charAt(1) == "1") {
            if (!streaming) {
                streaming = true
                startStream()
            }
        } else {
            streaming = false
        }
    }
})

bluetooth.onBluetoothConnected(function () {
    basic.showIcon(IconNames.Yes)
    basic.pause(400)
    basic.clearScreen()
})

bluetooth.onBluetoothDisconnected(function () {
    // never leave the robot driving without the tablet
    streaming = false
    stopRobot()
    basic.showIcon(IconNames.No)
})

input.onButtonPressed(Button.A, function () {
    bluetooth.uartWriteString("A\n")
})
input.onButtonPressed(Button.B, function () {
    bluetooth.uartWriteString("B\n")
})
input.onGesture(Gesture.Shake, function () {
    bluetooth.uartWriteString("H\n")
})
