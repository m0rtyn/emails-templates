
$( "#target" ).click(function() {
    $.ajax({
        method: "POST",
        url: "/tracker/haraka/unsubscribe",
        data: { campaing_id : campign_id, contact_id: contact_id }
    })
        .done(function() {
            $(".unsub-block").addClass("success-unsub");
            $("button").addClass("hidden");
            $(".unsub").addClass("hidden");
            $(".success").removeClass("hidden");
        })
        .fail(function() {
            $(".unsub-block").addClass("success-unsub");
            $("button").addClass("hidden");
            $(".unsub").addClass("hidden");
            $(".success").removeClass("hidden");
        })
});
