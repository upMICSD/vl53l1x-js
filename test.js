const VL53L1X = require('./vl53l1x');
const I2C = require('raspi-i2c').I2C;
const NUM_OF_DATA = 50;

var fs = require('fs');
const csv = require('csvtojson');
const { Parser } = require('json2csv');
//const parser = require('csv-parser');
//import  { stringify } from 'csv-stringify';
//var stringify = require('csv-stringify');

/*
async function export_to_csv (array, file) {
    console.log(array);
    const data = new Parser({fields: array}).parse(array);
    fs.writeFileSync(file, data);
}
*/

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main () {
    const sensor = new VL53L1X ({
        i2c: new I2C()
    });

    //Sensor ID
    const sensorId = await sensor.getSensorId();
    console.log(`sensorId = ${sensorId}`);

    //Boot State
    const bootState = await sensor.bootState();
    console.log(`bootState = ${bootState}`);

    //Initiate the sensor
    await sensor.sensorInit();

    //Distance Mode = LONG
    const distanceMode = await sensor.getDistanceMode();
    console.log(`distanceMode = ${distanceMode === VL53L1X.DISTANCE_MODE_SHORT ? 'SHORT' : 'LONG'}`);

    //Timing Budget
    const timingBudgetInMs = await sensor.getTimingBudgetInMs();
    console.log(`timing budget = ${timingBudgetInMs}ms`);

    //Inter Measurement Interval
    const iM = await sensor.getInterMeasurementInMs();
    console.log(`inter measurement interval = ${iM}ms`);

    try {
        //RefSPAD Calibration
        //??

        //Ofset Calibration
        await sensor.setOffset(await sensor.calibrateOffset(140));
        //console.log('\nOffset: ' + await sensor.getOffset() + '\n');

        //Xtalk Calibration
        //await sensor.setXtalk(3);

        //Start Ranging
        await sensor.startRanging();
        let data_array = [];
        let time_array = [];
        let distance_array = [];

        //Long Distance Mode set of data
        const start = new Date();
        let count = 0;
        for (let i = 0; i < NUM_OF_DATA; i += 1) {
            await sensor.waitForDataReady();
            const distance = await sensor.getDistance();
            //console.log(`Distance = ${distance} mm`);
            count += distance;
            const aux = new Date();
            let timex = aux-start;
            //console.log(`Time = ${timex/1000} s`);
            const rangeStatus = await sensor.getRangeStatus();
            //console.log(`Range status = ${rangeStatus}`);
            data_array.push({"time": timex, "distance": distance});
            time_array.push(timex);
            distance_array.push(distance);
            await sensor.clearInterrupt();
            await sleep(500);
        }
        console.log(data_array);
        console.log(`Average measuremt: ${count/NUM_OF_DATA} mm`);
        //export_to_csv(data_array,"data.csv");
        /*
        stringify(data_array, { header: true }, function (err, output) {
            fs.writeFile(__dirname+'/someData.csv', output);
            console.log('File created successfuly');
        });
        */

        
        
        //Distance Mode = SHORT
        await sensor.setDistanceMode(VL53L1X.DISTANCE_MODE_SHORT);
        const distanceMode2 = await sensor.getDistanceMode();
        //console.log(`distanceMode = ${distanceMode2 === VL53L1X.DISTANCE_MODE_SHORT ? 'SHORT' : 'LONG'}`);
        const timingBudgetInMs2 = await sensor.getTimingBudgetInMs();
        //console.log(`timing budget = ${timingBudgetInMs2}ms`);

        //Short Distance Mode set of data
        for (let i = 0; i < NUM_OF_DATA; i += 1) {
            await sensor.waitForDataReady();
            const distance = await sensor.getDistance();
            //console.log(`Distance = ${distance} mm`);
            await sensor.clearInterrupt();
            await sleep(500);
        }

        const end = new Date();
        console.log(`Rate: ${100000/(end-start)}Hz`);

    } finally {
        await sensor.stopRanging();
    }

}

main();


module.exports = VL53L1X;