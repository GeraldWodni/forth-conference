// Guests SQL CRUD
// (c)copyright 2014-2021 by Gerald Wodni <gerald.wodni@gmail.com>

var _       = require("underscore");
const Latex   = require("./latex");

module.exports = {
    setup: function( k ) {
        var kData = k.getData();
        const latex = Latex(k);

        var prices = k.setupOpts.prices;

        function sendPdf( req, res, next, opts ) {
            k.requestman( req );
            req.kern.db.query("SELECT * FROM guests WHERE id=?", [ req.requestman.id() ], function( err, data ) {
                if( err )
                    return next( err );
                console.log( data );

                /* get personal data */
                data = data[0];
                var e = latex.escape;

                var address = _.map( data.address.split(/,\s*/g), e ).join("\\\\\n");
                console.log( address );

                /* get price clear text */
                var selectedHotel = {};
                _.each( prices.hotels, function( hotel ) {
                    _.each( hotel.modes, function( mode ) {
                        /* mode found, use this set */
                        if( mode.value == data.hotel ) {
                            /* hotel price & data */
                            selectedHotel = {
                                header: e( hotel.header ),
                                mode: {
                                    name: mode.name.replace(/:\s*$/g, ''),
                                    price: latex.escapeNumber( mode.complete, 2 ),
                                    single: mode.value.indexOf( "+SingleRoom" ) > 0
                                },
                                extraDays: ""
                            };

                            /* extra days */
                            _.each( hotel.extraDays, function( extraDay ) {
                                if( data.extraDays.indexOf( extraDay.value ) >= 0 ) {
                                    if( selectedHotel.extraDays == "" )
                                        selectedHotel.extraDays = "\\tableTitle{Extra days}\n";

                                    selectedHotel.extraDays += e( extraDay.name ) + " & " + latex.escapeNumber( selectedHotel.mode.single ? extraDay.single : extraDay.double, 2 ) + "\\\\\n";
                                }
                            });
                        }
                    });
                });

                /* create and send pdf */
                latex.sendPdf( req, res, next, {
                    name: e( data.name ),
                    address: address,
                    hotel: selectedHotel,
                    total: latex.escapeNumber( data.price, 2 )
                }, _.extend( opts, {
                    filename: opts.filePrefix + data.name.replace(/\s+/g, '_') + ( opts.fileSuffix || ".pdf" )
                }));
            });
        }

        k.router.get("/invoice/pdf/:id", function( req, res, next ) {
            sendPdf( req, res, next, {
                template: "templates/invoice.tex"
            });
        });

        k.router.get("/invoice/pdf-download/:id", function( req, res, next ) {
            sendPdf( req, res, next, {
                filePrefix: "Invoice-",
                template: "templates/invoice.tex",
                forceDownload: true
            });
        });

        k.router.get("/confirmation/pdf/:id", function( req, res, next ) {
            sendPdf( req, res, next, {
                template: "templates/confirmation.tex"
            });
        });

        k.router.get("/confirmation/pdf-download/:id", function( req, res, next ) {
            sendPdf( req, res, next, {
                filePrefix: "Confirmation-",
                template: "templates/confirmation.tex",
                forceDownload: true
            });
        });

        k.router.get("/confirmation/tex-download/:id", function( req, res, next ) {
            sendPdf( req, res, next, {
	    	sendSource: true,
                filePrefix: "Confirmation-",
		fileSuffix: ".tex",
                template: "templates/confirmation.tex",
                forceDownload: true
            });
        });

        k.crud.presenter( k, kData.guests, {
            
            title: "Guests",
            path: "/admin/guests",
            jadeFile: "admin/guests",

            fields: {
                //id:             { text: "ID",               type: "text", filter: "id" },
                name:           { text: "Name",             type: "text" },
                state:          { text: "State",            type: "enum", keys: ["open", "paid"] },
                vip:            { text: "VIP",              type: "checkbox" },
                price:          { text: "Price",            type: "text", filter: "decimal" },
                hotel:          { text: "Hotel",            type: "text" },
                extraDays:      { text: "Extra Days",       type: "text" },
                address:        { text: "Address",          type: "text", filter: "address" },
                telephone:      { text: "Telephone",        type: "tel" },
                email:          { text: "Email",            type: "email" },
                remark:         { text: "Remark",           type: "textarea", filter: "raw" },
                //partner:        { text: "Partner",          type: "enum", keys: ["Kein+T0", "Partner+T0", "Partner-T0"]},
                partner:        { text: "Partner",          type: "text" },
                partnerName:    { text: "Parnter name",     type: "text" },
                partnerAddress: { text: "Parnter address",  type: "text", filter: "address" },
                editHash:       { text: "Edit hash",       type: "text", attributes: { readonly: true } },
                presentationTitle:      { text: "Presentation Title",       type: "text" },
                presentationDescription:{ text: "Presentation Description", type: "textarea" },
                presentationLength:     { text: "Presentation Length",      type: "text" },
                helping:                { text: "Helping",              type: "textarea" },
            }

        });
    }
};
