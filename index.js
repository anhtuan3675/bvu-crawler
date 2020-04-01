
const interval = 600000;    //  Auto crawling each 10mins
const crawler = require('./crawler');
const fs = require('fs');
const logger = require('morgan');
const http = require('http');
const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');
const router = express();
const app = express();


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
var server = http.createServer(app);


const port = 5000;
app.listen(process.env.PORT || port, () =>
{
    console.log(`App started on port ${port}.\n`); 

    
    letCrawl();
    setInterval(() =>
    {
        letCrawl();
    }, interval);
});



app.get('/', function (req, res) { res.send("Server chạy ngon lành."); });

app.get('/schedules', function(req, res)
{
    const date = req.query.date;
    const classname = req.query.class;
    var path = getFilePath(date);


    if (path !== "")
    {
        if (classname)
        {
            let json = getJSONbyClassName(path, classname);
            if (json.length)
            {
                res.contentType("text/html");
                res.status(200).send(json);
            }
            else
            {
                res.status(404).send([]);
            }
        }
        else
        {
            var data = fs.readFileSync(path);
            res.contentType("text/html");
            res.status(200).send(data);
        }
    }
    else
    {
        res.status(404).send([]);
    }
});

app.get('/followingSchedules', async function(req, res)
{
    res.status(200).send(await getFollowingSchedules());
});

app.get('/changeConvertAPI', function(req, res)
{
    let apiKey = req.query.key;
    console.log(apiKey);
    fs.writeFileSync('./convertKEY.txt', apiKey);
    res.status(200).send('API key updated successfully.');
});




function getFilePath(date)
{
    console.log("Required: " + date);
    const path = `./schedules/${date}/schedule_${date}.txt`;


    try
    {
        if (fs.existsSync(path))
        {
            console.log("Directory exists.")
            return path;
        }
        else
        {
            console.log("Directory does not exist.")
            return "";
        }
    }
    catch(e)
    {
        console.log("An error occurred." + e)
        return "";
    } 
}


function letCrawl()
{
    try
    {
        console.log("\nAuto crawl starting ...");
        crawler.doCrawl();
    }
    catch(err)
    {
        console.log(err);
    }
}


function getJSONbyClassName(filename, expectedClassname)
{
    let classes = [];
    let json = fs.readFileSync(filename, {encoding: 'utf8'});
    json = JSON.parse(json);
    // console.log(json);

    for (let i = 0; i < json.length; ++i)
    {
        let subjects = json[i].Subjects;
        for (let j = 0; j < subjects.length; ++j)
        {
            let classname = subjects[j].Class;

            if (classname)
            {
                classname = classname.replace('\r\n', '').toLowerCase();
                if (classname === expectedClassname.toLowerCase())
                    classes.push(subjects[j]);
            }
        }
    }

    return classes;
}


async function getFollowingSchedules()
{
    try
    {
        let currDate = await getCurrentDate();
        let currSegs = currDate.split('-');


        let stream = await new Promise((resolve, reject) =>
        {
            fs.readdir('./schedules/', (err, files) =>
            {
                if (err)
                    console.log(err);
                else
                {
                    let followingDates = [];
                    files.forEach((value, index) =>
                    {
                        let segments = value.split('-');
                        if (parseInt(currSegs[0], 10) <= parseInt(segments[0], 10))     //  so sánh ngày
                        {
                            if (parseInt(currSegs[1], 10) <= parseInt(segments[1], 10)) //  so sánh tháng
                                followingDates.push(value);
                        }
                    });


                    return resolve(followingDates);
                }
            });
        });


        return stream;
    }
    catch (err)
    {
        console.log(err);
    }
}


async function getCurrentDate()
{
    try
    {
        let stream = await new Promise((resolve, reject) =>
        {
            let d = new Date();
            let date = d.getDate();
            let dateString = (date >= 10) ? date:`0${date}`;
            let month = d.getMonth() + 1;
            let monthString = (month >= 10) ? month: `0${month}`;
            let year = d.getFullYear();
    
            return resolve(`${dateString}-${monthString}-${year}`);
        });


        return stream;
    }
    catch (err)
    {
        console.log(err);
    }
}