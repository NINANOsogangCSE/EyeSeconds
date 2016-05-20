var express=require('express');
var app=express();

app.use(express.static('hompi/Demo'));
app.use(express.static('hompi'));

app.get('/',function(req,res){
  res.sendFile(__dirname+'/hompi/Demo/index.html');
});

app.listen(3000,function(){
  console.log('listening on port 3000');
})
