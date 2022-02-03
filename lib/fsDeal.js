const fs = require('fs')
const path = require('path')
class FS {
    constructor(dir){
        this.dir = dir 
    }


    read(){
        return fs.readFileSync(path.resolve(__dirname, this.dir), { encoding: 'utf-8', flag: 'r'})
    }

    write(content){
        fs.writeFile(path.resolve(__dirname, this.dir), JSON.stringify(content, null, 4), (err) =>{
            if(err) throw err
            console.log('ok')
        })
    }
}

module.exports = FS