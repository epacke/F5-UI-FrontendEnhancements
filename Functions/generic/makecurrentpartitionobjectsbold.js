function makeCurrentPartitionObjectsBold(){
    //Get the current partition
    currentpartition = getCookie("F5_CURRENT_PARTITION")

    $("tbody#list_body tr td a").filter(function(){
        return $(this).attr("href").indexOf("/" + currentpartition + "") >= 0
    }).each(function(){
        $(this).css('font-weight', 700);
    });
}