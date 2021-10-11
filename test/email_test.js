const mailer = require('nodemailer');

async function main(){
	mailer.createTestAccount((err, account) => {
		if(err){
			console.error('Failed to create account: ', err);
			return process.exit(1);
		}
		console.log("mail account user: ", account.user);
		console.log("mail account pass: ", account.pass);
		const transporter = mailer.createTransport({
			name: 'example.com',
			host: account.smtp.host,
			port: account.smtp.port,
			secure: account.smtp.secure,
			auth: {
				user: account.user,
				pass: account.pass
			}
		});
		
		const mailData = {
			from: '"PowerClip" <notifications@powerclip.com>',
			to: "'Burton Jaursch' <burton.jaursch@gmail.com>",
			subject: "Your video is ready!",
			text: `Your PowerClip is ready! \nYour video id is: blank. Use the following request to download your video: `,
			html: '<p><b>Your PowerClip is ready!</b> \nYour video id is: blank. Use the following request to download your video: </p>'
		};
		transporter.sendMail(mailData, (err, info) => {
			if(err){
				console.error(err);
			}else{
				console.log('Email Sent!');
				console.log(mailer.getTestMessageUrl(info));
				//console.log(info);
			}
		});	
	});	
}

main();