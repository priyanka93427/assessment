const springedge = require('springedge');
const apikey = '' //write your api key of spring edge
const { msg } = require('../../config/message')

exports.sendSmsFromSpringedge = async (mobile, smsBody, otp) => {
    try {
        var params = {
            'sender': 'SEDEMO',
            'apikey': apikey,
            'to': [
                mobile  //Moblie Numbers 919876543212
            ],
            'message': `Hello ${otp}, This is a otp test message from spring edge`,
            'format': 'json'
        };

        const response = await new Promise((resolve, reject) => {
            springedge.messages.send(params, 5000, function (err, response) {
                if (err) {
                    return reject({ msg: 'fail', error: err });
                }
                resolve({ msg: 'write your api key of spring edge first', ...response });
            });
        });

        return response
    } catch (error) {
        console.log(error.message, 'write your api key of spring edge first')
    }
};
