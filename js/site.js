$(function(){
    
    $("input[type='checkbox']").add("input[type='radio']").change( function() {
        var $this = $(this);

        if( $this.attr("type") == "radio" ) {
            var matchingExtraDays = $this.closest(".row").nextAll(".extraDays").first();
            var otherExtraDays = matchingExtraDays.siblings(".extraDays");

            var priceMode = $this.attr("value").indexOf("+SingleRoom") > 0 ? "single" : "double";

            otherExtraDays.find("input").prop( "disabled", true );
            otherExtraDays.find("input").prop( "checked", false );
            otherExtraDays.find(".priceText").text("");

            matchingExtraDays.find("input").prop( "disabled", false ).each( function( index, element ) {
                var $element = $(element);
                var price = $element.attr("data-" + priceMode);
                $element.siblings(".priceText").text( " €" + parseFloat( price ).toFixed(2) );
                $element.attr("data-price", price);
            });
        }

        /* calculate new total */
        var total = 0;

        $("input[type='radio']:checked").each( function( index, element ) {
            total += parseFloat( $(element).attr("data-price") );
        });

        $("input[type='checkbox']:checked").each( function( index, element ) {
            total += parseFloat( $(element).attr("data-price") || "0" );
        });

        var priceText = ("" + total.toFixed(2) );
        $("#price").text( priceText );
        $("#submit span").text( priceText );

        var summary = "";
        var separator = "";
        $("input[type='radio']:checked").each(function(index, item) {
            summary += separator + '<span style="background-color:' + $(item).closest("label").css("background-color") + '">' + $(item).attr('data-hr') + "</span>";
            separator = ", ";
        });
        $("#summary").html( summary );
    });

    /* trigger selected or click first */
    if( $("input[type='radio']:checked").length > 0 )
        $("input[type='radio']:checked").trigger("change");
    else
        $("input[type='radio']").first().click();

    /* update timezones */
    /* needs to be h4 ending with '(UTC+0)' followed by ul. each li must start with a time formatted HH:MM in UTC */
    const timeZoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = -(new Date()).getTimezoneOffset()/60;
    console.log( timeZoneName, offset );
    function offsetTime( time ) {
        var [hours, minutes] = time.split(":");
        hours = (parseInt( hours ) + offset) % 24;
        if( hours < 10 )
            hours = "0" + hours;
        return `${hours}:${minutes}`;
    }
    console.log( offset );
    document.querySelectorAll("h4").forEach( h4 => {
        if( h4.textContent.indexOf("UTC(+0)") < 0 )
            return;
        const ul = h4.nextElementSibling;
        if( ul.tagName.toUpperCase() != "UL" )
            return;
        h4.textContent = h4.textContent.replace( /UTC\(\+0\)/, "(" + timeZoneName + " UTC" + (offset < 0 ? "-" : "+") + offset + ")"  );
        [...ul.children].forEach( li => {
            const time = li.textContent.substring(0,5);
            if( !/[0-9]{2}:[0-9]{2}/.test( time ) )
                return;

            li.firstChild.textContent =  li.firstChild.textContent.substring(5);
            li.insertAdjacentHTML( 'afterbegin', `<span class="localtime" title="converted, original UTC: ${time}">${offsetTime(time)}</span>` );
        })
    });
});
