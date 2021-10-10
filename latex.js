// LaTeX compiler
// (c)copyright 2015-2021 by Gerald Wodni <gerald.wodni@gmail.com>

var spawn   = require("child_process").spawn;
var moment  = require("moment");
var async   = require("async");
var fs      = require("fs");
var path    = require("path");
var _       = require("underscore");
var tmp     = require("tmp");

/* escape latex */
function _e( text ) {
    text = (text + '').replace( /\\/g, "\\textbackslash " );
    text = text.replace( /[&%$#{}_]/g, "\\$&");
    text = text.replace( /~/g,  "\\textasciitilde" );
    text = text.replace( /\^/g, "\\textasciicircum" );
    return text;
}

function e( text ) {
    return _e( text ).replace( /\r?\n/g, "\\\\\n" );
}

/* escape-table */
function et( text ) {
    return _e( text ).replace( /\r?\n/g, "\\newline\n" );
}

function n( num, tail, sep )  {
    return (num.toFixed( tail ) + "").replace( /\./, sep || "." );
}


module.exports = function _setup(k) {
    return {
        escape: e,
        escapeNumber: n,
        sendPdf: function sendPdf( req, res, next, data, opts ) {
            opts = opts || {};

            console.log( "PDF-DATA:", data );

            var values = {};

            /* escape all data */
            //_.each( data, function( value, key ) {
            //    values[key] = e( value );
            //});
            values = data;

            /* template */
            k.readHierarchyFile( req.kern.website, opts.template, function( err, templates ){
                    
                if( err )
                    return next(err);

                var template = templates[0];
                template = template.replace( /\\kernData{([a-zA-Z0-9.+]+)}{([^}]+)\}/g, function( match, name, mod ) {
                    var value;

                    /* TODO: fix rdb.getField, or move it to different module! */
                    function getField( item, field ) { 
                        var index = field.indexOf( "." );
                        if( index > 0 ) 
                            return getField( item[ field.substring( 0, index ) ], field.substring( index + 1 ) );
                        else
                            return item[ field ]
                    };
                        

                    /* getField, handle undefined */
                    try {
                        value = getField( values, name );
                        //value = k.rdb.getField( values, name );
                    } catch(e) {
                        console.log( "UNKNOWN-FIELD-CATCH: " + name );
                        return "\\unknownValue{" + name + "}";
                    }

                    if( _.isUndefined( value ) ) {
                        console.log( "UNKNOWN-FIELD: " + name );
                        return "\\unknownValue{" + name + "}";
                    }
                    else if( mod == "LOCALE" )
                        return req.locales.__( value );
                    else
                        return value;
                });


	        if( opts.sendSource ) {
                    if( opts.forceDownload )
                        res.header({
                            "Content-Type": "application/force-download",
                            "Content-Disposition": 'attachment; filename="' + opts.filename + '"'
                        });
                    else
                        res.header( "Content-Type", "text/tex" );

                    res.end(template);
                    return
                }

                /* call pdflatex in temporary directory */
                tmp.dir( { unsafeCleanup: true }, function( err, tempDir, cleanup ) {
                    if( err )
                        return next( err );

                    console.log( "TEMP:", tempDir );

                    /* write template */
                    var texFilename = path.join( tempDir, "kern.tex" );
                    var pdfFilename = path.join( tempDir, "kern.pdf" );

                    fs.writeFile( texFilename, template, function( err ) {
                        if( err )
                            return next( err );

                        /* execute latex */
                        function pdflatex( d ) {
                            var latex = spawn( "pdflatex", [ "-interaction=batchmode", "kern.tex" ], { cwd: tempDir } );

                            latex.stdout.on( "data", function( data ) { console.log( "pdflatex".white.bold, "" + data ); } );
                            latex.stderr.on( "data", function( data ) { console.log( "pdflatex".red.bold,   "" + data ); } );

                            latex.on("close", function( code ) {
                                console.log( "Latex Returned: ", code );
                                d();
                            });
                        }

                        /* run latex 3 times, make sure common.tex has been written */
                        async.series( [ pdflatex, pdflatex, pdflatex,
                            function() {

                                /* send pdf */
                                fs.readFile( pdfFilename, function( err, content ) {
                                    if( err )
                                        return next( err );

                                    /* send */
                                    if( opts.forceDownload )
                                        res.header({
                                            "Content-Type": "application/force-download",
                                            "Content-Disposition": 'attachment; filename="' + opts.filename + '"'
                                        });
                                    else
                                        res.header( "Content-Type", "application/pdf" );

                                    res.end(content);
                                    cleanup();
                                });
                            }
                        ] );
                    });
                });

            });
        }
    };
};
