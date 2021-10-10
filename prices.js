// euro.theforth.net price settings

module.exports = {
    year: 2021,
    myName: "myEuroForth",
    operatorEmail: "gerald.wodni@gmail.com",
    operatorBankAccount: "TODO: use environment variable or function instead",
    chatRegistration: "TODO: use environment variable instead",
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
