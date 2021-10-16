// euro.theforth.net price settings

module.exports = {
    conference: "EuroForth",
    year: 2021,
    registerButton: "Register",
    myName: "myEuroForth",
    operatorEmail: "gerald.wodni@gmail.com",
    operatorBankAccount: "TODO: use environment variable or function instead",
    chatRegistration: "TODO: use environment variable instead",

    /* message to show after successful registration */
    successTemplate: function _successTemplate( { price } ) { "Thank you for your registration!\nPlease transfer  € " + price + ` to the bank account provided in your email - see special COVID19 instructions on the website (which you should receive in a few moments from ${process.env.SMTP_EMAIL}).` },
    /* registration email text body */
    emailTemplate: function _emailTemplate( { prices, values, price, website } ) {
        return `Hotel: ${values.hotel}\nExtra days: ${values.extraDays}\nPrice (total): ${price}`
            + ( price > 0 ? `\nPlease transfer the full amount in Euro to:\n${prices.operatorBankAccount}` : '' )
            + ( prices.chatRegistration ? `\n\n${process.env.CHAT_REGISTRATION}` : '' )
            + `\n\nYou can update your presentation details by yourself here: https://${website}/${prices.myName}/${values.editHash}`
            + `\n\nName: ${values.name}`
            + `\nAddress: ${values.address}`
            + `\nTelephone: ${values.telephone}`
            + `\nEmail: ${values.email}`
            + `\n\nEntourage: ${values.partner}\nName: ${values.partnerName}\nAdresse: ${values.partnerAddress}`
            + `\n\nPresentation: ${values.presentationTitle} Length: ${values.presentationLength}\n${values.presentationDescription}`
            + `\n\nRemark: ${values.remark}`;
    },
    meeting: {
        openRegistration: "2021-08-15",
        start: "2021-09-10"
    },
    hotels: [
        {
            header: "Online - EuroForth conference only (10.-12. September)",
            description: "Full access",
            modes: [
                { name: "Single person:",                     value: "EuroForth+Online",    complete: 0.00 },
            ]
        },
        {
            header: "Online Supporter - EuroForth conference only (10.-12. September)",
            description: "Full access + a cosy feeling you support the hosting hardware, forth-standard.org, theforth.net and more",
            modes: [
                { name: "Single person:",                     value: "Supporter+EuroForth+Online",    complete: 25.20 },
            ]
        },
        {
            header: "Online - Forth standard meeting &  EuroForth conference (8.-12. September)",
            description: "Full access",
            modes: [
                { name: "Single person:",                     value: "STD+EuroForth+Online",    complete: 0.00 },
            ]
        },
        {
            header: "Online Supporter - Forth standard meeting &  EuroForth conference (8.-12. September)",
            description: "Full access + a cosy feeling you support the hosting hardware, forth-standard.org, theforth.net and more",
            modes: [
                { name: "Single person:",                     value: "Supporter+STD+EuroForth+Online",    complete: 50.40 },
            ]
        }
    ]
}
